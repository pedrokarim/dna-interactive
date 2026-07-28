import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailFallbackLink, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = { setUrl: string; name?: string | null; locale?: EmailLocale };

// Pour les comptes créés via Discord/Google qui veulent AUSSI un mot de passe.
const copy = {
  fr: {
    preview: "Définis un mot de passe pour ton compte DNA",
    title: "Définir un mot de passe",
    greeting: (n: string) => `Salut ${n},`,
    intro:
      "Ton compte utilise une connexion Discord ou Google. Définis un mot de passe pour pouvoir aussi te connecter avec ton email, sans dépendre d'un service tiers.",
    cta: "Définir mon mot de passe",
    note: "Ce lien expire dans 1 heure. Tes connexions Discord/Google continueront de fonctionner en parallèle.",
  },
  en: {
    preview: "Set a password for your DNA account",
    title: "Set a password",
    greeting: (n: string) => `Hi ${n},`,
    intro:
      "Your account currently signs in with Discord or Google. Set a password to also sign in with your email, independent of any third-party service.",
    cta: "Set my password",
    note: "This link expires in 1 hour. Your Discord/Google sign-ins will keep working alongside it.",
  },
  de: {
    preview: "Lege ein Passwort für dein DNA-Konto fest",
    title: "Passwort festlegen",
    greeting: (n: string) => `Hallo ${n},`,
    intro:
      "Dein Konto meldet sich derzeit über Discord oder Google an. Lege ein Passwort fest, um dich auch mit deiner E-Mail-Adresse anzumelden – unabhängig von Drittanbietern.",
    cta: "Passwort festlegen",
    note: "Dieser Link läuft in 1 Stunde ab. Deine Discord-/Google-Anmeldungen funktionieren weiterhin parallel.",
  },
  es: {
    preview: "Define una contraseña para tu cuenta de DNA",
    title: "Definir una contraseña",
    greeting: (n: string) => `Hola ${n}:`,
    intro:
      "Tu cuenta inicia sesión con Discord o Google. Define una contraseña para poder entrar también con tu correo, sin depender de un servicio externo.",
    cta: "Definir mi contraseña",
    note: "Este enlace caduca en 1 hora. Tus inicios de sesión con Discord/Google seguirán funcionando en paralelo.",
  },
  jp: {
    preview: "DNA アカウントのパスワードを設定してください",
    title: "パスワードの設定",
    greeting: (n: string) => `${n}さん、こんにちは`,
    intro:
      "現在このアカウントは Discord または Google でログインしています。パスワードを設定すると、外部サービスに依存せず、メールアドレスでもログインできるようになります。",
    cta: "パスワードを設定する",
    note: "このリンクは 1 時間で失効します。Discord／Google でのログインは引き続きご利用いただけます。",
  },
  kr: {
    preview: "DNA 계정의 비밀번호를 설정하세요",
    title: "비밀번호 설정",
    greeting: (n: string) => `안녕하세요, ${n}님`,
    intro:
      "현재 이 계정은 Discord 또는 Google로 로그인합니다. 비밀번호를 설정하면 외부 서비스에 의존하지 않고 이메일로도 로그인할 수 있습니다.",
    cta: "비밀번호 설정하기",
    note: "이 링크는 1시간 후 만료됩니다. Discord/Google 로그인은 계속 함께 사용할 수 있습니다.",
  },
  tc: {
    preview: "為你的 DNA 帳號設定密碼",
    title: "設定密碼",
    greeting: (n: string) => `你好，${n}`,
    intro:
      "你的帳號目前透過 Discord 或 Google 登入。設定密碼後，你也可以用電子郵件登入，不必依賴第三方服務。",
    cta: "設定我的密碼",
    note: "此連結將在 1 小時後失效。你的 Discord／Google 登入方式仍可繼續使用。",
  },
} as const;

export function SetPassword({ setUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  const who = name?.trim();
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.title}</EmailHeading>
      {who ? <EmailText>{t.greeting(who)}</EmailText> : null}
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={setUrl}>{t.cta}</EmailButton>
      <EmailNote>{t.note}</EmailNote>
      <EmailFallbackLink href={setUrl} />
    </EmailLayout>
  );
}

export default SetPassword;
