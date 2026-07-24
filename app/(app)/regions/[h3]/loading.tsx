import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <section className="view" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <Spinner label="Carregando região…" />
    </section>
  );
}
