import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="emptystate">
      {icon && <div className="eico">{icon}</div>}
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action && <div className="eaction">{action}</div>}
    </div>
  );
}
