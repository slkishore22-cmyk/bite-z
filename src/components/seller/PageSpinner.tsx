export const PageSpinner = () => (
  <div className="min-h-screen grid place-items-center bg-background">
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-xs font-bold tracking-[0.2em]">LOADING…</span>
    </div>
  </div>
);