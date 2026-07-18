import AuthShell from "@/components/auth/AuthShell";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const metadata = { title: "Nova senha — Lavra" };

export default function UpdatePasswordPage() {
  return (
    <AuthShell>
      <UpdatePasswordForm />
    </AuthShell>
  );
}
