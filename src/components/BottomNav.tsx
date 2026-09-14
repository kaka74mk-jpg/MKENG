import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LearnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
    <path d="M4 6.5c2.5-1.3 5.5-1.3 8 0v12c-2.5-1.3-5.5-1.3-8 0Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 6.5c-2.5-1.3-5.5-1.3-8 0v12c2.5-1.3 5.5-1.3 8 0Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ListenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="13" width="4" height="6" rx="1.2" />
    <rect x="17" y="13" width="4" height="6" rx="1.2" />
  </svg>
);

const PracticeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v4l2.6 2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
    <circle cx="12" cy="8.5" r="3.2" />
    <path d="M5 20c1.2-3.4 4-5.2 7-5.2s5.8 1.8 7 5.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "خانه", icon: <HomeIcon /> },
  { to: "/learn", label: "یادگیری", icon: <LearnIcon /> },
  { to: "/listen", label: "شنیدن", icon: <ListenIcon /> },
  { to: "/practice", label: "تمرین", icon: <PracticeIcon /> },
  { to: "/profile", label: "پروفایل", icon: <ProfileIcon /> },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-soft bg-ink/95 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="ناوبری اصلی"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition-colors ${
                  isActive ? "text-amber" : "text-parchment/50 hover:text-parchment/80"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
