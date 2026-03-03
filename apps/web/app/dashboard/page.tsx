"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CalendarCheck,
  Timer,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  activeCalendars: number;
  avgDuration: number;
}

interface Booking {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  calendarName: string;
  dateTime: string;
  status: "confirmed" | "pending" | "cancelled";
}

interface CalendarItem {
  id: string;
  name: string;
  duration: number;
  bookingsCount: number;
  slug: string;
}

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/20 text-amber-400",
  cancelled: "bg-slate-600/50 text-slate-400",
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-[#1e293b] p-6">
      <div className="mb-4 h-10 w-10 rounded-full bg-slate-700" />
      <div className="mb-2 h-8 w-20 rounded bg-slate-700" />
      <div className="h-4 w-28 rounded bg-slate-700" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, bookingsRes, calendarsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/bookings?limit=5"),
          fetch("/api/calendars?limit=3"),
        ]);

        if (statsRes.ok) {
          const statsData: unknown = await statsRes.json();
          setStats(statsData as DashboardStats);
        }
        if (bookingsRes.ok) {
          const bookingsData: unknown = await bookingsRes.json();
          setBookings(
            (bookingsData as { data: Booking[] }).data ?? (bookingsData as Booking[])
          );
        }
        if (calendarsRes.ok) {
          const calendarsData: unknown = await calendarsRes.json();
          setCalendars(
            (calendarsData as { data: CalendarItem[] }).data ??
              (calendarsData as CalendarItem[])
          );
        }
      } catch {
        // API not available yet — use empty state
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const kpis = [
    {
      label: "Total Bookings",
      value: stats?.totalBookings ?? 0,
      icon: Calendar,
    },
    {
      label: "Today's Bookings",
      value: stats?.todayBookings ?? 0,
      icon: Clock,
    },
    {
      label: "Active Calendars",
      value: stats?.activeCalendars ?? 0,
      icon: CalendarCheck,
    },
    {
      label: "Avg Duration",
      value: stats?.avgDuration ? `${stats.avgDuration}m` : "0m",
      icon: Timer,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-slate-400">Good morning, Alex 👋</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="rounded-xl bg-[#1e293b] p-6"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{kpi.label}</p>
                </div>
              );
            })}
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl bg-[#1e293b]">
          {loading ? (
            <div className="animate-pulse space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-slate-700" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              No bookings yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                  <th className="px-6 py-3">Attendee</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Calendar</th>
                  <th className="hidden px-6 py-3 md:table-cell">
                    Date &amp; Time
                  </th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-700/50 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                          {b.attendeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {b.attendeeName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {b.attendeeEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-slate-300 sm:table-cell">
                      {b.calendarName}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-slate-300 md:table-cell">
                      {new Date(b.dateTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[b.status] ?? "bg-slate-600/50 text-slate-400"}`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Calendar Overview */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Calendar Overview
          </h2>
          <Link
            href="/dashboard/calendars"
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[260px] animate-pulse rounded-xl bg-[#1e293b] p-4"
              >
                <div className="mb-3 h-5 w-32 rounded bg-slate-700" />
                <div className="mb-2 h-4 w-20 rounded bg-slate-700" />
                <div className="h-4 w-24 rounded bg-slate-700" />
              </div>
            ))
          ) : calendars.length === 0 ? (
            <div className="w-full rounded-xl bg-[#1e293b] px-6 py-12 text-center text-slate-400">
              No calendars yet
            </div>
          ) : (
            calendars.map((cal) => (
              <div
                key={cal.id}
                className="min-w-[260px] rounded-xl bg-[#1e293b] p-4"
              >
                <h3 className="font-medium text-white">{cal.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                    {cal.duration} min
                  </span>
                  <span className="text-xs text-slate-400">
                    {cal.bookingsCount} bookings
                  </span>
                </div>
                <Link
                  href={`/dashboard/calendars/${cal.id}`}
                  className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Edit →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
