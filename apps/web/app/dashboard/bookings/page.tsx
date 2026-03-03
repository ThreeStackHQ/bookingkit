"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";

type BookingStatus = "confirmed" | "pending" | "cancelled";
type FilterTab = "all" | "upcoming" | "past" | "cancelled";

interface BookingEntry {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  calendarName: string;
  dateTime: string;
  duration: number;
  status: BookingStatus;
  location: string;
  notes: string;
}

const statusColors: Record<BookingStatus, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/20 text-amber-400",
  cancelled: "bg-slate-600/50 text-slate-400",
};

const ITEMS_PER_PAGE = 10;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarFilter, setCalendarFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingEntry | null>(
    null
  );
  const [page, setPage] = useState(1);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data: unknown = await res.json();
        setBookings(
          (data as { data: BookingEntry[] }).data ?? (data as BookingEntry[])
        );
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const calendarNames = useMemo(
    () => [...new Set(bookings.map((b) => b.calendarName))],
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const dt = new Date(b.dateTime);

      if (activeFilter === "upcoming") {
        if (dt <= now || b.status === "cancelled") return false;
      } else if (activeFilter === "past") {
        if (dt > now || b.status === "cancelled") return false;
      } else if (activeFilter === "cancelled") {
        if (b.status !== "cancelled") return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !b.attendeeName.toLowerCase().includes(q) &&
          !b.attendeeEmail.toLowerCase().includes(q)
        )
          return false;
      }

      if (calendarFilter && b.calendarName !== calendarFilter) return false;

      if (dateFrom && dt < new Date(dateFrom)) return false;
      if (dateTo && dt > new Date(dateTo + "T23:59:59")) return false;

      return true;
    });
  }, [bookings, activeFilter, searchQuery, calendarFilter, dateFrom, dateTo]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)
  );
  const paginatedBookings = filteredBookings.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  async function handleCancel(bookingId: string) {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" as const } : b
        )
      );
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: "cancelled" } : null
        );
      }
    } catch {
      // handle error
    }
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Bookings</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-[#1e293b] p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveFilter(tab.key);
              setPage(1);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search attendees..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-600 bg-[#0f172a] py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={calendarFilter}
          onChange={(e) => {
            setCalendarFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All calendars</option>
          {calendarNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-[#1e293b]">
        {loading ? (
          <div className="animate-pulse space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-slate-700" />
            ))}
          </div>
        ) : paginatedBookings.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            No bookings found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                  <th className="px-6 py-3">Attendee</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Calendar</th>
                  <th className="hidden px-6 py-3 md:table-cell">
                    Date &amp; Time
                  </th>
                  <th className="hidden px-6 py-3 lg:table-cell">Duration</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-700/50 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
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
                    <td className="hidden px-6 py-4 sm:table-cell">
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                        {b.calendarName}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-slate-300 md:table-cell">
                      {new Date(b.dateTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-slate-300 lg:table-cell">
                      {b.duration} min
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[b.status]}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          View
                        </button>
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredBookings.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-600 p-2 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-600 p-2 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[400px] overflow-y-auto bg-[#1e293b] p-6 shadow-xl transition-transform">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Booking Details
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Attendee info */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-semibold text-emerald-400">
                {selectedBooking.attendeeName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-white">
                  {selectedBooking.attendeeName}
                </p>
                <p className="text-sm text-slate-400">
                  {selectedBooking.attendeeEmail}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mb-6 space-y-3 rounded-lg bg-[#0f172a] p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Calendar</span>
                <span className="text-white">
                  {selectedBooking.calendarName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Date</span>
                <span className="text-white">
                  {new Date(selectedBooking.dateTime).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Time</span>
                <span className="text-white">
                  {new Date(selectedBooking.dateTime).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Duration</span>
                <span className="text-white">
                  {selectedBooking.duration} min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Location</span>
                <span className="text-white">
                  {selectedBooking.location || "Not set"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[selectedBooking.status]}`}
                >
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="mb-1 block text-sm text-slate-400">
                Notes
              </label>
              <textarea
                defaultValue={selectedBooking.notes}
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Add notes..."
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full rounded-lg bg-amber-500/20 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30">
                Reschedule
              </button>
              {selectedBooking.status !== "cancelled" && (
                <button
                  onClick={() => handleCancel(selectedBooking.id)}
                  className="w-full rounded-lg bg-red-500/20 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30"
                >
                  Cancel Booking
                </button>
              )}
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedBooking.calendarName)}&dates=${new Date(selectedBooking.dateTime).toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${new Date(new Date(selectedBooking.dateTime).getTime() + selectedBooking.duration * 60000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg border border-slate-600 py-2 text-center text-sm text-slate-300 hover:bg-slate-700"
              >
                Add to Google Calendar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
