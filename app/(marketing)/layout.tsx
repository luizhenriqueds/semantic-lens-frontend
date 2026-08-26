import "@/app/(marketing)/landing.css";
import OutageBanner from "@/components/layout/OutageBanner";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OutageBanner />
      <div className="lp-landing">{children}</div>
    </>
  );
}
