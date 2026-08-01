/** The one feedback block the auth forms share: a failure to act on, or a confirmation to read. */
export default function AuthAlert({
  kind,
  message,
  hint,
  action,
}: {
  kind: "bad" | "good";
  message: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={`au-alert ${kind}`} role={kind === "bad" ? "alert" : "status"}>
      <p>{message}</p>
      {hint && <span>{hint}</span>}
      {action}
    </div>
  );
}
