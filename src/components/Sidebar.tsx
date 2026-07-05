"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckSquare, FileText, Target, LayoutDashboard, Share2, LayoutGrid, TrendingUp, ListChecks, CalendarDays, CreditCard, Heart, Sparkles, Music } from "lucide-react";
import { cn } from "@/lib/utils";

const ownerLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/week", label: "Week View", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits/tracker", label: "Habits", icon: LayoutGrid },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/trading", label: "Trading Journal", icon: TrendingUp },
  { href: "/bucket-list", label: "Bucket List", icon: ListChecks },
  { href: "/social", label: "Social Media", icon: Share2 },
  { href: "/cards", label: "Card Benefits", icon: CreditCard },
  { href: "/wedding", label: "Wedding", icon: Heart },
  { href: "/freedom", label: "Prepare for Freedom", icon: Sparkles },
  { href: "/music-lovers", label: "Music Lovers Hub", icon: Music },
];

const partnerLinks = [
  { href: "/tasks",        label: "Tasks",            icon: CheckSquare },
  { href: "/wedding",      label: "Wedding",          icon: Heart },
  { href: "/music-lovers", label: "Music Lovers Hub", icon: Music },
];

const ownerMobileLinks = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/freedom", label: "Freedom", icon: Sparkles },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/music-lovers", label: "Music", icon: Music },
];

const partnerMobileLinks = [
  { href: "/tasks",        label: "Tasks",   icon: CheckSquare },
  { href: "/wedding",      label: "Wedding", icon: Heart },
  { href: "/music-lovers", label: "Music",   icon: Music },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isPartner = role === "partner";

  const links = isPartner ? partnerLinks : ownerLinks;
  const mobileLinks = isPartner ? partnerMobileLinks : ownerMobileLinks;
  const title = isPartner ? "Music Lovers" : "My Dashboard";
  const subtitle = isPartner ? "Shared hub" : "Personal workspace";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col" style={{ background: "#1b2824" }}>
        {/* Logo area */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(153,179,183,0.12)" }}>
          <h1 className="text-base font-semibold tracking-wide" style={{ color: "#eeece9" }}>{title}</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(153,179,183,0.7)" }}>{subtitle}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "text-white"
                    : "hover:text-white"
                )}
                style={active
                  ? { background: "rgba(110,61,35,0.7)", color: "#faf9f7" }
                  : { color: "rgba(238,236,233,0.55)" }
                }
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(153,179,183,0.08)"; e.currentTarget.style.color = "#eeece9"; }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(238,236,233,0.55)"; } }}
              >
                <Icon
                  size={16}
                  style={active ? { color: "#9d7960" } : { color: "rgba(153,179,183,0.6)" }}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(153,179,183,0.12)" }}>
          <p className="text-xs text-center" style={{ color: "rgba(153,179,183,0.4)" }}>
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
        style={{ background: "#1b2824", borderColor: "rgba(153,179,183,0.12)" }}
      >
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
              style={{ color: active ? "#9d7960" : "rgba(238,236,233,0.4)" }}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
