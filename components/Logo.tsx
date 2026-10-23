// The original Nautical Nomads wordmark: light, wide-tracked uppercase.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span aria-label="Nautical Nomads" className={`inline-flex items-center text-[15px] font-light tracking-[0.32em] uppercase sm:text-base ${className}`}>
      Nautical&nbsp;&nbsp;&nbsp;Nomads
    </span>
  );
}
