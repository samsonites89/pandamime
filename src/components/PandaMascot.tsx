export default function PandaMascot({ className, width = 66 }: { className?: string; width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pandamime.png"
      alt="Pandamime mascot"
      width={width}
      height={Math.round((1.1) * width)}
      className={className}
    />
  );
}
