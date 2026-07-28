import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailFallbackLink, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = { verifyUrl: string; name?: string | null; locale?: EmailLocale };

const copy = {
  fr: {
    preview: "Confirme ton adresse email pour activer ton compte DNA",
    hi: (n: string) => `Bienvenue ${n},`,
    intro: "Confirme ton adresse email pour activer ton compte et pouvoir te connecter avec ton mot de passe.",
    cta: "Confirmer mon email",
    note: "Ce lien expire dans 24 heures. Sans confirmation, la connexion par mot de passe reste bloquée.",
    fallbackName: "aventurier",
  },
  en: {
    preview: "Confirm your email to activate your DNA account",
    hi: (n: string) => `Welcome ${n},`,
    intro: "Confirm your email address to activate your account and sign in with your password.",
    cta: "Confirm my email",
    note: "This link expires in 24 hours. Until confirmed, password sign-in stays disabled.",
    fallbackName: "adventurer",
  },
  de: {
    preview: "Bestätige deine E-Mail-Adresse, um dein DNA-Konto zu aktivieren",
    hi: (n: string) => `Willkommen ${n},`,
    intro:
      "Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren und dich mit deinem Passwort anzumelden.",
    cta: "E-Mail bestätigen",
    note: "Dieser Link läuft in 24 Stunden ab. Ohne Bestätigung bleibt die Anmeldung per Passwort gesperrt.",
    fallbackName: "Abenteurer",
  },
  es: {
    preview: "Confirma tu correo para activar tu cuenta de DNA",
    hi: (n: string) => `Bienvenido ${n},`,
    intro: "Confirma tu dirección de correo para activar tu cuenta y poder iniciar sesión con tu contraseña.",
    cta: "Confirmar mi correo",
    note: "Este enlace caduca en 24 horas. Sin confirmar, el inicio de sesión con contraseña seguirá bloqueado.",
    fallbackName: "aventurero",
  },
  jp: {
    preview: "DNA アカウントを有効化するため、メールアドレスをご確認ください",
    hi: (n: string) => `ようこそ、${n}さん`,
    intro:
      "メールアドレスを確認すると、アカウントが有効になり、パスワードでログインできるようになります。",
    cta: "メールアドレスを確認する",
    note: "このリンクは 24 時間で失効します。確認が完了するまで、パスワードでのログインはご利用いただけません。",
    fallbackName: "冒険者",
  },
  kr: {
    preview: "DNA 계정을 활성화하려면 이메일을 확인해 주세요",
    hi: (n: string) => `환영합니다, ${n}님`,
    intro: "이메일 주소를 확인하면 계정이 활성화되어 비밀번호로 로그인할 수 있습니다.",
    cta: "이메일 확인하기",
    note: "이 링크는 24시간 후 만료됩니다. 확인 전까지 비밀번호 로그인은 사용할 수 없습니다.",
    fallbackName: "모험가",
  },
  tc: {
    preview: "確認你的電子郵件以啟用 DNA 帳號",
    hi: (n: string) => `歡迎，${n}`,
    intro: "確認你的電子郵件地址即可啟用帳號，並以密碼登入。",
    cta: "確認我的電子郵件",
    note: "此連結將在 24 小時後失效。在完成確認前，密碼登入仍會停用。",
    fallbackName: "冒險者",
  },
} as const;

export function VerifyEmail({ verifyUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  const who = name?.trim() || t.fallbackName;
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.hi(who)}</EmailHeading>
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={verifyUrl}>{t.cta}</EmailButton>
      <EmailNote>{t.note}</EmailNote>
      <EmailFallbackLink href={verifyUrl} />
    </EmailLayout>
  );
}

export default VerifyEmail;
