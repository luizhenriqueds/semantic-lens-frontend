import AuthShell from "@/components/auth/AuthShell";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const metadata = { title: "Nova senha" };

export default function UpdatePasswordPage() {
  return (
    <AuthShell>
      <UpdatePasswordForm />
    </AuthShell>
  );
}
