/** Supabase answers in English and the UI is pt-BR, so every auth failure is translated here.
 *  Keyed on the stable error code, with a text match for the releases that do not send one. */

export type RegisterError = {
  message: string;
  /** The address already has an account, so the form can point at the sign-in instead. */
  existing?: boolean;
  /** Second line, for the cases where the way out is not obvious from the message alone. */
  hint?: string;
};

const EXISTS = "Este e-mail já tem uma conta na Lavra.";
const GENERIC = "Não foi possível criar a conta agora. Tente novamente em instantes.";
const INVALID_EMAIL = "Confira o e-mail informado: o formato parece inválido.";

const BY_CODE: Record<string, RegisterError> = {
  email_exists: { message: EXISTS, existing: true },
  user_already_exists: { message: EXISTS, existing: true },
  weak_password: { message: "A senha precisa ter pelo menos 6 caracteres." },
  validation_failed: { message: INVALID_EMAIL },
  email_address_invalid: { message: INVALID_EMAIL },
  over_email_send_rate_limit: {
    message: "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
  },
  signup_disabled: { message: "O cadastro está fechado no momento." },
};

/** The account exists but the confirmation link never went out, so retrying the form would only
 *  hit "e-mail já cadastrado". The recovery link doubles as a confirmation, hence the pointer. */
export const mailFailure: RegisterError = {
  message: "Criamos a sua conta, mas não conseguimos enviar o e-mail de confirmação.",
  existing: true,
  hint: 'Na tela de entrar, use "Esqueci minha senha" para receber um novo link.',
};

export function registerError(raw?: { code?: string; message?: string } | null): RegisterError {
  const byCode = raw?.code && BY_CODE[raw.code];
  if (byCode) return byCode;

  const text = raw?.message ?? "";
  if (/already (been )?registered|already exists/i.test(text))
    return { message: EXISTS, existing: true };
  if (/password/i.test(text)) return BY_CODE.weak_password;
  if (/email/i.test(text)) return BY_CODE.validation_failed;
  return { message: GENERIC };
}
