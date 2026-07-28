import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailFallbackLink, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = { resetUrl: string; name?: string | null; locale?: EmailLocale };

const copy = {
  fr: {
    preview: "Réinitialise ton mot de passe DNA",
    title: "Réinitialisation du mot de passe",
    greeting: (n: string) => `Salut ${n},`,
    intro: "Tu as demandé à réinitialiser ton mot de passe. Choisis-en un nouveau via le bouton ci-dessous.",
    cta: "Choisir un nouveau mot de passe",
    note: "Ce lien expire dans 1 heure et ne peut servir qu'une fois. Si tu n'as rien demandé, ton mot de passe reste inchangé.",
  },
  en: {
    preview: "Reset your DNA password",
    title: "Reset your password",
    greeting: (n: string) => `Hi ${n},`,
    intro: "You asked to reset your password. Pick a new one using the button below.",
    cta: "Choose a new password",
    note: "This link expires in 1 hour and can be used once. If you didn't request it, your password stays unchanged.",
  },
  de: {
    preview: "Setze dein DNA-Passwort zurück",
    title: "Passwort zurücksetzen",
    greeting: (n: string) => `Hallo ${n},`,
    intro:
      "Du hast angefordert, dein Passwort zurückzusetzen. Wähle über die Schaltfläche unten ein neues aus.",
    cta: "Neues Passwort wählen",
    note: "Dieser Link läuft in 1 Stunde ab und ist nur einmal verwendbar. Falls du ihn nicht angefordert hast, bleibt dein Passwort unverändert.",
  },
  es: {
    preview: "Restablece tu contraseña de DNA",
    title: "Restablecer la contraseña",
    greeting: (n: string) => `Hola ${n}:`,
    intro: "Has pedido restablecer tu contraseña. Elige una nueva con el botón de abajo.",
    cta: "Elegir una contraseña nueva",
    note: "Este enlace caduca en 1 hora y solo puede usarse una vez. Si no lo has solicitado, tu contraseña seguirá igual.",
  },
  jp: {
    preview: "DNA のパスワードを再設定してください",
    title: "パスワードの再設定",
    greeting: (n: string) => `${n}さん、こんにちは`,
    intro: "パスワードの再設定がリクエストされました。下のボタンから新しいパスワードを設定してください。",
    cta: "新しいパスワードを設定する",
    note: "このリンクは 1 時間で失効し、1 回のみ使用できます。お心当たりがない場合、パスワードは変更されません。",
  },
  kr: {
    preview: "DNA 비밀번호를 재설정하세요",
    title: "비밀번호 재설정",
    greeting: (n: string) => `안녕하세요, ${n}님`,
    intro: "비밀번호 재설정을 요청하셨습니다. 아래 버튼에서 새 비밀번호를 설정해 주세요.",
    cta: "새 비밀번호 설정하기",
    note: "이 링크는 1시간 후 만료되며 한 번만 사용할 수 있습니다. 요청하지 않으셨다면 비밀번호는 그대로 유지됩니다.",
  },
  tc: {
    preview: "重設你的 DNA 密碼",
    title: "重設密碼",
    greeting: (n: string) => `你好，${n}`,
    intro: "你要求重設密碼。請透過下方按鈕設定新密碼。",
    cta: "設定新密碼",
    note: "此連結將在 1 小時後失效，且僅能使用一次。若非你本人要求，你的密碼將維持不變。",
  },
} as const;

export function ResetPassword({ resetUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  const who = name?.trim();
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.title}</EmailHeading>
      {who ? <EmailText>{t.greeting(who)}</EmailText> : null}
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={resetUrl}>{t.cta}</EmailButton>
      <EmailNote>{t.note}</EmailNote>
      <EmailFallbackLink href={resetUrl} />
    </EmailLayout>
  );
}

export default ResetPassword;
