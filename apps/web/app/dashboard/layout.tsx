"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  BarChart2,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendars", href: "/dashboard/calendars", icon: CalendarDays },
  { label: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex items-center gap-2 px-6 py-5">
        <Calendar className="h-6 w-6 text-emerald-500" />
        <span className="text-lg font-bold text-emerald-500">BookingKit</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400">
            AJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-200">
              Alex Johnson
            </p>
            <p className="truncate text-xs text-slate-400">alex@acme.com</p>
          </div>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
            Pro Plan
          </span>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col border-r border-slate-700 bg-[#1e293b] md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-700 bg-[#0f172a] px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-slate-400 hover:text-slate-200"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />
          <span className="font-bold text-emerald-500">BookingKit</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-60 flex-col bg-[#1e293b]">
            <div className="flex justify-end px-4 py-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen md:ml-60">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
