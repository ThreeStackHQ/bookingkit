"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, CalendarPlus, Copy, Check, Trash2 } from "lucide-react";

interface CalendarEntry {
  id: string;
  name: string;
  slug: string;
  duration: number;
  color: string;
  active: boolean;
  bookingsCount: number;
}

interface CreateForm {
  name: string;
  duration: number;
}

export default function CalendarsPage() {
  const [calendars, setCalendars] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    duration: 30,
  });
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCalendars = useCallback(async () => {
    try {
      const res = await fetch("/api/calendars");
      if (res.ok) {
        const data: unknown = await res.json();
        setCalendars(
          (data as { data: CalendarEntry[] }).data ?? (data as CalendarEntry[])
        );
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  async function handleCreate() {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ name: "", duration: 30 });
        await fetchCalendars();
      }
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this calendar?")) return;
    try {
      await fetch(`/api/calendars/${id}`, { method: "DELETE" });
      setCalendars((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // handle error
    }
  }

  function copyBookingUrl(calendar: CalendarEntry) {
    const url = `${window.location.origin}/${calendar.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(calendar.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Calendars</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          New Calendar
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              New Calendar
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Product Demo"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Duration
                </label>
                <select
                  value={createForm.duration}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      duration: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.name.trim()}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-[#1e293b] p-5"
            >
              <div className="mb-3 h-5 w-32 rounded bg-slate-700" />
              <div className="mb-2 h-4 w-full rounded bg-slate-700" />
              <div className="h-8 w-20 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      ) : calendars.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-[#1e293b] px-6 py-16">
          <CalendarPlus className="mb-4 h-12 w-12 text-slate-500" />
          <p className="mb-2 text-lg font-medium text-white">
            No calendars yet
          </p>
          <p className="mb-6 text-sm text-slate-400">
            Create your first calendar to start accepting bookings
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Create your first calendar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {calendars.map((cal) => (
            <div key={cal.id} className="rounded-xl bg-[#1e293b] p-5">
              {/* Top */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cal.color || "#10b981" }}
                />
                <span className="font-medium text-white">{cal.name}</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                  {cal.duration} min
                </span>
              </div>

              {/* Booking URL */}
              <div className="mb-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-slate-800 px-2 py-1 text-xs text-slate-400">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/${cal.slug}`
                    : `/${cal.slug}`}
                </code>
                <button
                  onClick={() => copyBookingUrl(cal)}
                  className="text-slate-400 hover:text-emerald-400"
                >
                  {copiedId === cal.id ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mb-4 text-xs text-slate-400">
                {cal.bookingsCount} bookings
              </p>

              {/* Bottom */}
              <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${cal.active ? "bg-emerald-500" : "bg-slate-500"}`}
                  />
                  <span className="text-xs text-slate-400">
                    {cal.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/calendars/${cal.id}`}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(cal.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
