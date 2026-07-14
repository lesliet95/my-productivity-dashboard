"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckSquare, FileText, Target, LayoutDashboard, Share2, LayoutGrid,
  TrendingUp, ListChecks, CalendarDays, CalendarPlus, CreditCard, Heart, Sparkles,
  Music, MoreHorizontal, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ownerLinks = [
  { href: "/",            label: "Dashboard",         icon: LayoutDashboard },
  { href: "/week",        label: "Week View",          icon: CalendarDays },
  { href: "/events",      label: "Events",              icon: CalendarPlus },
  { href: "/tasks",       label: "Tasks",              icon: CheckSquare },
  { href: "/habits/tracker", label: "Habits",          icon: LayoutGrid },
  { href: "/notes",       label: "Notes",              icon: FileText },
  { href: "/goals",       label: "Goals",              icon: Target },
  { href: "/trading",     label: "Trading Journal",    icon: TrendingUp },
  { href: "/bucket-list", label: "Bucket List",        icon: ListChecks },
  { href: "/social",      label: "Social Media",       icon: Share2 },
  { href: "/cards",       label: "Card Benefits",      icon: CreditCard },
  { href: "/wedding",     label: "Wedding",            icon: Heart },
  { href: "/freedom",     label: "Prepare for Freedom", icon: Sparkles },
  { href: "/music-lovers", label: "Music Lovers Hub",  icon: Music },
];

const partnerLinks = [
  { href: "/events",       label: "Events",           icon: CalendarPlus },
  { href: "/tasks",        label: "Tasks",            icon: CheckSquare },
  { href: "/wedding",      label: "Wedding",          icon: Heart },
  { href: "/music-lovers", label: "Music Lovers Hub", icon: Music },
];

// First 4 shown in bottom bar, rest in "More" sheet
const ownerMobileLinks = [
  { href: "/",            label: "Home",    icon: LayoutDashboard },
  { href: "/tasks",       label: "Tasks",   icon: CheckSquare },
  { href: "/week",        label: "Week",    icon: CalendarDays },
  { href: "/music-lovers", label: "Music",  icon: Music },
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
  const [moreOpen, setMoreOpen] = useState(false);

  const links = isPartner ? partnerLinks : ownerLinks;
  const mobileLinks = isPartner ? partnerMobileLinks : ownerMobileLinks;
  const moreLinks = isPartner ? [] : ownerLinks.filter((l) => !ownerMobileLinks.some((m) => m.href === l.href));
  const title = isPartner ? "Music Lovers" : "My Dashboard";
  const subtitle = isPartner ? "Shared hub" : "Personal workspace";

  const isMoreActive = moreLinks.some((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col" style={{ background: "#07203f" }}>
        <div className="p-6 border-b" style={{ borderColor: "rgba(235,222,212,0.12)" }}>
          <h1 className="text-base font-semibold tracking-wide" style={{ color: "#eeece9" }}>{title}</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(217,170,144,0.7)" }}>{subtitle}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all", active ? "text-white" : "hover:text-white")}
                style={active ? { background: "rgba(166,94,70,0.55)", color: "#faf9f7" } : { color: "rgba(238,236,233,0.55)" }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(217,170,144,0.08)"; e.currentTarget.style.color = "#eeece9"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(238,236,233,0.55)"; } }}
              >
                <Icon size={16} style={active ? { color: "#d9aa90" } : { color: "rgba(217,170,144,0.5)" }} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "rgba(235,222,212,0.12)" }}>
          <p className="text-xs text-center" style={{ color: "rgba(217,170,144,0.35)" }}>
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
        style={{ background: "#07203f", borderColor: "rgba(235,222,212,0.12)" }}>
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
              style={{ color: active ? "#d9aa90" : "rgba(238,236,233,0.4)" }}>
              <Icon size={19} />
              {label}
            </Link>
          );
        })}

        {/* More button */}
        {moreLinks.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
            style={{ color: isMoreActive || moreOpen ? "#d9aa90" : "rgba(238,236,233,0.4)" }}
          >
            <MoreHorizontal size={19} />
            More
          </button>
        )}
      </nav>

      {/* More sheet — slides up from bottom */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl pb-8 pt-3"
            style={{ background: "#07203f", borderTop: "1px solid rgba(235,222,212,0.12)" }}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b" style={{ borderColor: "rgba(235,222,212,0.12)" }}>
              <div className="w-10 h-1 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" style={{ background: "rgba(153,179,183,0.3)" }} />
              <p className="text-xs font-semibold mt-2" style={{ color: "rgba(238,236,233,0.5)" }}>All Pages</p>
              <button onClick={() => setMoreOpen(false)} style={{ color: "rgba(238,236,233,0.4)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Grid of links */}
            <div className="grid grid-cols-3 gap-px mt-2 px-2">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl transition-colors"
                    style={active
                      ? { background: "rgba(110,61,35,0.5)", color: "#d9aa90" }
                      : { color: "rgba(238,236,233,0.55)" }
                    }
                  >
                    <Icon size={22} />
                    <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
