import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  ...props,
});

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconBuilding = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 21V7l8-4 8 4v14" />
    <path d="M9 21v-6h6v6" />
    <path d="M9 11h.01M15 11h.01" />
  </svg>
);
export const IconGroups = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 16 9 5 9-5" />
    <path d="m3 12 9 5 9-5" />
  </svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 4 2 4 4.5.6-3.2 3.1.8 4.5L12 14.7 7.9 16.3l.8-4.5L5.5 8.6 10 8z" />
  </svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconBack = (p: P) => (
  <svg {...base(p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </svg>
);
export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);
export const IconHouse = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 21V8l8-5 8 5v13" />
    <path d="M9 21v-7h6v7" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4m8-4v4M3 10h18" />
  </svg>
);
export const IconCollection = (p: P) => (
  <svg {...base(p)} strokeWidth={1.3}>
    <path d="M2 21h20" />
    <path d="M3.5 21V10.5L10 6.5l6.5 4V21" />
    <path d="M3.5 10.5 10 6.5l6.5 4" />
    <path d="M8 21v-4.5h4V21" />
    <path d="M16.5 21V12.5H21V21" />
    <path d="M18.5 15.5h.01M18.5 18h.01" />
  </svg>
);

export const POI_ICON: Record<string, (p: P) => React.ReactElement> = {
  university: (p) => (
    <svg {...base(p)}>
      <path d="M3 9l9-4 9 4-9 4-9-4Z" />
      <path d="M7 11v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2v-4" />
    </svg>
  ),
  hospital: (p) => (
    <svg {...base(p)}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  supermarket: (p) => (
    <svg {...base(p)}>
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
      <path d="M2 3h3l2.2 11h11l1.6-7H6.2" />
    </svg>
  ),
  shopping_center: (p) => (
    <svg {...base(p)}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  ),
  park: (p) => (
    <svg {...base(p)}>
      <path d="M12 3l5 7h-3l3 5H7l3-5H7l5-7Z" />
      <path d="M12 15v6" />
    </svg>
  ),
  restaurant: (p) => (
    <svg {...base(p)}>
      <path d="M6 3v7a2 2 0 0 0 4 0V3M8 11v10" />
      <path d="M16 3c-1.4 0-2 2-2 4s.6 4 2 4m0-8v18" />
    </svg>
  ),
  hotel: (p) => (
    <svg {...base(p)}>
      <path d="M3 19v-9M3 13h10a3 3 0 0 1 3 3v3M3 19v-2h18v2M21 19v-3" />
      <circle cx="7" cy="11.5" r="1.5" />
    </svg>
  ),
  school: (p) => (
    <svg {...base(p)}>
      <path d="M5 4h13a1 1 0 0 1 1 1v15H6a1 1 0 0 0-1 1V5a1 1 0 0 1 1-1Z" />
      <path d="M19 17H6" />
    </svg>
  ),
  bank: (p) => (
    <svg {...base(p)}>
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18" />
    </svg>
  ),
  pharmacy: (p) => (
    <svg {...base(p)}>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M12 11v5M9.5 13.5h5M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};
