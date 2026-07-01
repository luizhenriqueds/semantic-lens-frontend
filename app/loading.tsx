export default function Loading() {
  return (
    <section className="view">
      <div className="pagehead">
        <div className="skel" style={{ height: 34, width: "40%", marginBottom: 10 }} />
        <div className="skel" style={{ height: 18, width: "70%" }} />
      </div>
      <div className="pgrid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel" style={{ height: 300 }} />
        ))}
      </div>
    </section>
  );
}
