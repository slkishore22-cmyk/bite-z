export const SkeletonRow = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-20 animate-pulse rounded-2xl border border-border bg-gradient-card"
      />
    ))}
  </div>
);