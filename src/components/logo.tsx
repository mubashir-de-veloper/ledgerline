export function Logo({ light = false, large = false }: { light?: boolean; large?: boolean }) {
  const size = large ? "text-[1.8rem]" : "text-[1.15rem]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${size} leading-none tracking-[-0.04em]`}
      style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
    >
      <span className={light ? "text-on-ink" : "text-ink"}>LEDGERLINE</span>
      <span
        className="inline-block w-[0.35em] h-[0.35em] rounded-full translate-y-[0.05em]"
        style={{ background: "var(--color-signal)" }}
        aria-hidden="true"
      />
    </span>
  );
}
