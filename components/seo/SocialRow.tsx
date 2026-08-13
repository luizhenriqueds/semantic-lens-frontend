import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/seo/social";

export default function SocialRow({ className = "" }: { className?: string }) {
  if (!SOCIAL_LINKS.length && !CONTACT_EMAIL) return null;
  return (
    <div className={`socialrow${className ? ` ${className}` : ""}`}>
      {SOCIAL_LINKS.map((s) => (
        <a key={s.key} href={s.url} rel="me noopener noreferrer" target="_blank">
          {s.label}
        </a>
      ))}
      {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`}>Contato</a>}
    </div>
  );
}
