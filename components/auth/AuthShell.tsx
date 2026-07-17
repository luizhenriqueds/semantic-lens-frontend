import LavraLogo from "@/components/brand/LavraLogo";
import AuthDemo from "./AuthDemo";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="au-split">
      <aside className="au-demo-pane" aria-hidden="true">
        <svg className="au-hexbg">
          <defs>
            <path id="au-hcell" d="M-28 0 L-14 -24.25 L14 -24.25 L28 0 L14 24.25 L-14 24.25 Z" />
            <pattern id="au-hx" width="84" height="48.5" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <use href="#au-hcell" x="28" y="24.25" />
                <use href="#au-hcell" x="70" y="0" />
                <use href="#au-hcell" x="70" y="48.5" />
                <use href="#au-hcell" x="-14" y="0" />
                <use href="#au-hcell" x="-14" y="48.5" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#au-hx)" />
        </svg>

        <span className="au-brand">
          <LavraLogo size={30} />
          <span>
            lavra<i>.</i>
          </span>
        </span>

        <div className="au-tagline">
          <h2>
            Encontre o arremate certo <em>antes de todo mundo</em>.
          </h2>
          <p>
            Descreva o que procura e a busca ranqueia os imóveis em leilão que combinam com você.
          </p>
        </div>

        <AuthDemo />
      </aside>

      <section className="au-form-pane">
        <span className="au-mobilebrand">
          <LavraLogo size={26} />
          <span>
            lavra<i>.</i>
          </span>
        </span>
        {children}
      </section>
    </div>
  );
}
