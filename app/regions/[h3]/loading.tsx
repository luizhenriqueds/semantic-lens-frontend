import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <section className="view">
      <Spinner label="Carregando região…" />
    </section>
  );
}
