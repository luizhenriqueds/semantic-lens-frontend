import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  art,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  art?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="emptystate">
      {art ? <div className="eart">{art}</div> : icon && <div className="eico">{icon}</div>}
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action && <div className="eaction">{action}</div>}
    </div>
  );
}
