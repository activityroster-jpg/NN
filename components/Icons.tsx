// Inline icons (no icon font, no external requests).
type P = { className?: string };
const base = (className?: string) => ({ className: className ?? "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true });

export const IconCheck = ({ className }: P) => (<svg {...base(className)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IconArrowRight = ({ className }: P) => (<svg {...base(className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconArrowLeft = ({ className }: P) => (<svg {...base(className)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const IconMenu = ({ className }: P) => (<svg {...base(className)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = ({ className }: P) => (<svg {...base(className)}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconPin = ({ className }: P) => (<svg {...base(className)}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconCalendar = ({ className }: P) => (<svg {...base(className)}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>);
export const IconUsers = ({ className }: P) => (<svg {...base(className)}><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.2c2.3.3 4 1.8 4.5 4.3" /></svg>);
export const IconBed = ({ className }: P) => (<svg {...base(className)}><path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3" /><circle cx="7" cy="10.5" r="1.6" /></svg>);
export const IconRuler = ({ className }: P) => (<svg {...base(className)}><path d="M3 15l12-12 6 6-12 12z" /><path d="M7 11l2 2M10 8l2 2M13 5l2 2" /></svg>);
export const IconSnow = ({ className }: P) => (<svg {...base(className)}><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /></svg>);
export const IconShower = ({ className }: P) => (<svg {...base(className)}><path d="M4 21V6a3 3 0 0 1 6 0" /><path d="M8 9h8" /><path d="M10 13v1M13 13v1M16 13v1M10 17v1M13 17v1M16 17v1" /></svg>);
export const IconAnchor = ({ className }: P) => (<svg {...base(className)}><circle cx="12" cy="5" r="2" /><path d="M12 7v14M5 12H3a9 9 0 0 0 18 0h-2M8 10h8" /></svg>);
export const IconChef = ({ className }: P) => (<svg {...base(className)}><path d="M7 14v5h10v-5" /><path d="M7 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 16 6a4 4 0 1 1 1 8" /></svg>);
export const IconHelm = ({ className }: P) => (<svg {...base(className)}><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="1.6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>);
export const IconShield = ({ className }: P) => (<svg {...base(className)}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>);
export const IconClock = ({ className }: P) => (<svg {...base(className)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconChat = ({ className }: P) => (<svg {...base(className)}><path d="M4 5h16v11H9l-5 4z" /></svg>);
export const IconSliders = ({ className }: P) => (<svg {...base(className)}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>);
export const IconInfo = ({ className }: P) => (<svg {...base(className)}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg>);
export const IconMail = ({ className }: P) => (<svg {...base(className)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6l8.5 7 8.5-7" /></svg>);

export function SocialIcon({ name, className = "h-5 w-5" }: { name: "instagram" | "youtube" | "tiktok" | "facebook"; className?: string }) {
  switch (name) {
    case "instagram":
      return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>);
    case "youtube":
      return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" /></svg>);
    case "tiktok":
      return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3a7 7 0 0 1-4-1.3v6.2A5.8 5.8 0 1 1 10.8 9v3.1a2.8 2.8 0 1 0 2.8 2.8V3z" /></svg>);
    case "facebook":
      return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M14 8.5V6.8c0-.8.5-1 .9-1h2.3V2.1L14 2c-3.5 0-4.3 2.6-4.3 4.3v2.2H7.5V12h2.2v10H14V12h2.9l.4-3.5z" /></svg>);
  }
}
