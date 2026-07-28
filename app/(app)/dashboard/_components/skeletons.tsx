export function HeroSkeleton() {
  return (
    <div className="hero skel-hero">
      <div className="skphoto" />
      <div className="herobody">
        <div className="skline w45" />
        <div className="skline w70" />
        <div className="skpill" />
        <div className="skline w55" />
        <div className="skline w70" />
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="insights">
      {[0, 1, 2].map((i) => (
        <div className="ins" key={i}>
          <div className="skline w45" />
          <div className="skline w70" />
          <div className="skline" />
        </div>
      ))}
    </div>
  );
}

const RAIL_SKELETON_CARDS = 5;

export function RailSkeleton({ hideHead = false }: { hideHead?: boolean }) {
  return (
    <section className="railsec">
      {!hideHead && (
        <div className="sectitle wide">
          <div className="tx">
            <div className="skline w45" style={{ height: 18 }} />
            <div className="skline w70" style={{ marginTop: 8 }} />
          </div>
        </div>
      )}
      <div className="rail-track skel-track">
        {Array.from({ length: RAIL_SKELETON_CARDS }, (_, i) => (
          <div className="skcard" key={i}>
            <div className="skphoto" />
            <div className="skbody">
              <div className="skline w70" />
              <div className="skline w45" />
              <div className="skline w55" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <section className="railsec">
      <div className="sectitle wide">
        <div className="tx">
          <div className="skline w45" style={{ height: 18 }} />
        </div>
      </div>
      <div className="regiongrid">
        {Array.from({ length: cells }, (_, i) => (
          <div className="region skel-region" key={i}>
            <div className="skline w55" />
            <div className="skline w45" />
            <div className="skline" />
          </div>
        ))}
      </div>
    </section>
  );
}
