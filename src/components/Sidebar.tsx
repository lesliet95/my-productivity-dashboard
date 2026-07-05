"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, FileText, Target, LayoutDashboard, Share2, LayoutGrid, TrendingUp, ListChecks, CalendarDays, CreditCard, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
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
];

// Show these 5 in the bottom nav on mobile (most-used pages)
const mobileLinks = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/freedom", label: "Freedom", icon: Sparkles },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/wedding", label: "Wedding", icon: Heart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Productivity</h1>
          <p className="text-sm text-gray-500 mt-1">Your personal hub</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={18} className={active ? "text-indigo-600" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-indigo-600" : "text-gray-400"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
