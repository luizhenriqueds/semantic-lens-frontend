import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Criar conta - Lavra" };

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
