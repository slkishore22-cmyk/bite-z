type Props = {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; to?: string };
};

import { Link } from "react-router-dom";

export const EmptyState = ({ icon, title, description, action }: Props) => {
  const ActionInner = action ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition hover:bg-primary/90">
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
      {action.label}
    </span>
  ) : null;

  return (
    <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-6 py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-muted-foreground/70">{icon}</span>
      <p className="mt-3 text-base font-extrabold">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Link to={action.to}>{ActionInner}</Link>
          ) : (
            <button onClick={action.onClick} type="button">{ActionInner}</button>
          )}
        </div>
      )}
    </div>
  );
};