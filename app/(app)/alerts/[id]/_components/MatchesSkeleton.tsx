const SKELETON_ROWS = 5;

export default function MatchesSkeleton() {
  return (
    <div aria-busy="true">
      <div className="viewbar">
        <div className="skline w45" style={{ height: 18 }} />
      </div>
      <div className="wlist">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <div className="wcard skel" key={i}>
            <div className="skphoto wphoto-sk" />
            <div className="wmain">
              <div className="skpill" />
              <div className="skline w70" />
              <div className="skline w45" />
            </div>
            <div className="wcol-sk">
              <div className="skline w55" />
              <div className="skline w70" />
            </div>
            <div className="wcol-sk">
              <div className="skline w55" />
              <div className="skline w45" />
            </div>
            <div className="wcol-sk">
              <div className="skline w70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
