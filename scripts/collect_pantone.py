#!/usr/bin/env python3
"""
collect_pantone.py
==================

Builds a local dataset of named Pantone fashion colors (cotton / paper /
polyester) with hex values you derive yourself from the public color chips.

Two phases, each resumable (safe to Ctrl-C and re-run):

  phase 1  "codes"  -> sweeps the RGB cube, asks the color-finder endpoint for
                       near matches, unions the unique codes + names from the
                       three named books.  Writes named_codes.json
  phase 2  "chips"  -> fetches each color's .webp chip once, samples the center,
                       and stores a hex you computed.  Writes named_table.json

Final output: named_table.json  ->  [{code, name, material, hex, source}, ...]

The color-finder API takes ~5s per call (server-side auth + upstream lookup),
so this uses a small worker pool. With ~5 workers each blocked ~5s, the
aggregate rate is about one request/second -- the same gentle load as a polite
serial run, just without sitting idle. It also stops sweeping early once new
colors stop showing up, to avoid wasting slow calls on near-duplicates.

The values you store are approximations sampled from published chips, not
official Pantone data -- present them as "closest approximate match" with a
non-affiliation notice.
"""

import argparse
import io
import json
import os
import random
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from statistics import median

import requests
from PIL import Image

# --------------------------------------------------------------------------- #
# config
# --------------------------------------------------------------------------- #

ENDPOINT = "https://i8k09r4vbf.execute-api.us-east-1.amazonaws.com/prod/Pantone_PantoneColorFinder"
CHIP_URL = "https://www.pantone.com/media/color-finder/img/chips/pantone-color-chip-{slug}.webp"

CODES_FILE = "named_codes.json"   # phase 1 output / resume state
TABLE_FILE = "named_table.json"   # phase 2 output / resume state

# Exact bookId keys as they appear in the API response.
# NOTE the inconsistent casing in their own API: cotton is "Fh", the other two are "Fhi".
# Cotton (TCX) and paper (TPG) mostly mirror each other but each surfaces colors the
# other's top-8 window misses, so both are kept; --collapse dedups true overlaps later.
# Nylon Brights (TN) and Metallic Shimmers (TPM) are separate numbering systems.
NAMED_BOOKS = {
    "pantoneFhCottonTcx":            "cotton",
    "pantoneFhiPaperTpg":            "paper",
    "pantoneFhiPolyesterTsx":        "polyester",
    "pantoneFhNylonBrightsTn":       "nylon",
    "pantoneFhiMetallicShimmersTpm": "metallic",
}

TIMEOUT = 30
HEADERS = {"User-Agent": "pantone-pet-project/1.0 (personal, non-commercial)"}

# convergence / early stop (phase 1)
BATCH_FRACTION = 8        # batch size = workers * this
MIN_BATCHES = 4           # never early-stop before this many batches
NEW_THRESHOLD = 3         # a batch finding fewer than this many new colors is "stale"

_lock = threading.Lock()
_local = threading.local()


def session() -> requests.Session:
    """One requests.Session per worker thread (Session isn't guaranteed thread-safe)."""
    if not hasattr(_local, "s"):
        _local.s = requests.Session()
        _local.s.headers.update(HEADERS)
    return _local.s


# --------------------------------------------------------------------------- #
# pure helpers (unit-testable, no network)
# --------------------------------------------------------------------------- #

def slug(code: str) -> str:
    """'18-1664 TCX' -> '18-1664-tcx',  '663 CP' -> '663-cp'."""
    return code.strip().lower().replace(" ", "-")


def extract_named(payload: dict) -> list:
    """Pull {code, name, material} for the three named books out of one response."""
    out = []
    for book in payload.get("pantone", {}).get("connect", []):
        material = NAMED_BOOKS.get(book.get("bookId"))
        if not material:
            continue
        for c in book.get("colors", []):
            if c.get("code"):
                out.append({"code": c["code"], "name": c.get("name"), "material": material})
    return out


def sample_hex_from_image(img: Image.Image) -> str:
    """Flatten transparency, crop to the center 60%, return the median pixel as hex."""
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, img.convert("RGBA"))
    img = img.convert("RGB")
    w, h = img.size
    img = img.crop((int(w * 0.2), int(h * 0.2), int(w * 0.8), int(h * 0.8)))
    px = list(img.getdata())
    r, g, b = (int(median(p[i] for p in px)) for i in range(3))
    return f"#{r:02x}{g:02x}{b:02x}"


# --------------------------------------------------------------------------- #
# network calls (isolated so they can be stubbed in tests)
# --------------------------------------------------------------------------- #

def fetch_codes_for_hex(hx: str) -> list:
    resp = session().post(ENDPOINT, json={"searchType": "hex", "searchTerm": hx}, timeout=TIMEOUT)
    resp.raise_for_status()
    return extract_named(resp.json())


def fetch_chip_hex(code: str) -> str:
    resp = session().get(CHIP_URL.format(slug=slug(code)), timeout=TIMEOUT)
    resp.raise_for_status()
    return sample_hex_from_image(Image.open(io.BytesIO(resp.content)))


# --------------------------------------------------------------------------- #
# io helpers
# --------------------------------------------------------------------------- #

def load_json(path, default):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default


def save_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)   # atomic; a Ctrl-C mid-write can't corrupt the file


def chunked(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


# --------------------------------------------------------------------------- #
# phase 1 -- collect codes + names (concurrent, with early stop)
# --------------------------------------------------------------------------- #

def collect_codes(step, workers, early_stop):
    state = load_json(CODES_FILE, {"queried": [], "colors": {}})
    queried = set(state["queried"])
    colors = state["colors"]

    grid = range(0, 256, step)
    targets = [f"{r:02x}{g:02x}{b:02x}" for r in grid for g in grid for b in grid]
    random.shuffle(targets)                          # broad coverage early -> early stop is meaningful
    pending = [t for t in targets if t not in queried]
    print(f"[phase 1] {len(targets)} grid points (step={step}); "
          f"{len(queried)} already done, {len(pending)} pending, "
          f"{len(colors)} colors so far; {workers} workers")

    batch_size = max(workers * BATCH_FRACTION, workers)
    stale = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for bi, batch in enumerate(chunked(pending, batch_size)):
            new_in_batch = 0
            futures = {ex.submit(fetch_codes_for_hex, hx): hx for hx in batch}
            for fut in as_completed(futures):
                hx = futures[fut]
                try:
                    found = fut.result()
                except Exception as e:
                    print(f"  [{hx}] error: {e} (will retry next run)")
                    continue                          # don't mark queried -> retried later
                with _lock:
                    for item in found:
                        if item["code"] not in colors:
                            colors[item["code"]] = item
                            new_in_batch += 1
                    queried.add(hx)
            save_json(CODES_FILE, {"queried": sorted(queried), "colors": colors})
            print(f"  batch {bi + 1}: +{new_in_batch} new | {len(colors)} total | {len(queried)} queried")

            if early_stop and bi + 1 >= MIN_BATCHES:
                stale = stale + 1 if new_in_batch < NEW_THRESHOLD else 0
                if stale >= 2:
                    print(f"  converged ({stale} stale batches) -- stopping early. "
                          f"Re-run with --no-early-stop or smaller --step for more.")
                    break

    save_json(CODES_FILE, {"queried": sorted(queried), "colors": colors})
    print(f"[phase 1] done: {len(colors)} unique colors -> {CODES_FILE}")
    return colors


# --------------------------------------------------------------------------- #
# phase 2 -- sample each chip once (concurrent; chips are fast CDN images)
# --------------------------------------------------------------------------- #

def build_table(colors, workers):
    existing = load_json(TABLE_FILE, [])
    table = {row["code"]: row for row in existing} if isinstance(existing, list) else dict(existing)
    todo = [c for code, c in colors.items() if code not in table]
    print(f"[phase 2] {len(table)} chips already sampled, {len(todo)} to go; {workers} workers")

    done = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(fetch_chip_hex, c["code"]): c for c in todo}
        for fut in as_completed(futures):
            c = futures[fut]
            try:
                hexv = fut.result()
            except Exception as e:
                print(f"  [{c['code']}] chip error: {e} -- skipping")
                continue
            row = dict(c)
            row["hex"] = hexv
            row["source"] = "chip"
            with _lock:
                table[c["code"]] = row
                done += 1
                if done % 25 == 0:
                    save_json(TABLE_FILE, list(table.values()))
                    print(f"  {done}/{len(todo)} sampled | {len(table)} colors with hex")

    save_json(TABLE_FILE, list(table.values()))
    print(f"[phase 2] done: {len(table)} colors with hex -> {TABLE_FILE}")
    return list(table.values())


# --------------------------------------------------------------------------- #
# optional -- collapse true duplicates (cotton/paper share numbering)
# --------------------------------------------------------------------------- #

COLLAPSE_FILE = "named_table_collapsed.json"
SUFFIX_PREF = {"cotton": 0, "paper": 1, "polyester": 2, "nylon": 3, "metallic": 4}


def base_identity(row):
    """Cotton & paper share one numbering system, so '14-0760 TCX' and '14-0760 TPG'
    are the same color identity. All other books use their own systems -> never merged."""
    if row["material"] in ("cotton", "paper"):
        return "fashion:" + row["code"].rsplit(" ", 1)[0]    # drop TCX/TPG suffix
    return f'{row["material"]}:{row["code"]}'


def collapse_table(rows):
    """Merge cotton/paper duplicates; keep everything unique. Prefers the TCX code
    and hex when both exist, and records which materials a color appeared in."""
    groups = {}
    for r in rows:
        groups.setdefault(base_identity(r), []).append(r)
    out = []
    for members in groups.values():
        members.sort(key=lambda r: SUFFIX_PREF.get(r["material"], 9))
        chosen = members[0]
        out.append({
            "code": chosen["code"],
            "name": chosen["name"],
            "hex": chosen["hex"],
            "materials": sorted({m["material"] for m in members}),
        })
    return out


# --------------------------------------------------------------------------- #
# entrypoint
# --------------------------------------------------------------------------- #

def main():
    ap = argparse.ArgumentParser(description="Collect named Pantone fashion colors + sampled hex.")
    ap.add_argument("phase", nargs="?", default="all", choices=["codes", "chips", "all"],
                    help="codes = phase 1 only, chips = phase 2 only, all = both (default)")
    ap.add_argument("--step", type=int, default=32,
                    help="RGB grid step. 32=~512 calls (fast), 24=~1300, 16=~4100 (denser). Default 32.")
    ap.add_argument("--workers", type=int, default=5,
                    help="Concurrent requests. ~5 keeps the rate near 1 req/s given 5s latency. Default 5.")
    ap.add_argument("--no-early-stop", action="store_true",
                    help="Sweep the full grid instead of stopping once new colors dry up.")
    ap.add_argument("--collapse", action="store_true",
                    help="Also write a deduped table merging cotton/paper overlaps.")
    args = ap.parse_args()

    if args.phase in ("codes", "all"):
        colors = collect_codes(args.step, args.workers, early_stop=not args.no_early_stop)
    else:
        colors = load_json(CODES_FILE, {"colors": {}})["colors"]
        if not colors:
            print(f"No {CODES_FILE} found -- run the 'codes' phase first.")
            return

    if args.phase in ("chips", "all"):
        table = build_table(colors, args.workers)
        if args.collapse:
            collapsed = collapse_table(table)
            save_json(COLLAPSE_FILE, collapsed)
            print(f"[collapse] {len(table)} rows -> {len(collapsed)} unique -> {COLLAPSE_FILE}")


if __name__ == "__main__":
    main()
