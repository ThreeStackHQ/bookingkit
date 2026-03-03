"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Tab = "general" | "availability" | "notifications";
type LocationType = "video" | "phone" | "in-person" | "custom";

interface CalendarDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: number;
  locationType: LocationType;
  color: string;
  maxBookingsPerDay: number;
  bufferBefore: number;
  bufferAfter: number;
  timezone: string;
  availability: DayAvailability[];
  notifications: NotificationSettings;
}

interface DayAvailability {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

interface NotificationSettings {
  confirmationEmail: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  calendarInvite: boolean;
}

const durations = [15, 30, 45, 60, 90];
const locationTypes: { value: LocationType; label: string }[] = [
  { value: "video", label: "Video call" },
  { value: "phone", label: "Phone" },
  { value: "in-person", label: "In-person" },
  { value: "custom", label: "Custom" },
];
const colorOptions = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f43f5e",
  "#f59e0b",
  "#06b6d4",
];
const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Amsterdam",
  "Asia/Tokyo",
];
const defaultDays: DayAvailability[] = [
  { day: "Monday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Tuesday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Wednesday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Thursday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Friday", enabled: true, start: "09:00", end: "17:00" },
  { day: "Saturday", enabled: false, start: "09:00", end: "17:00" },
  { day: "Sunday", enabled: false, start: "09:00", end: "17:00" },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-600"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

export default function CalendarDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendar, setCalendar] = useState<CalendarDetail>({
    id: "",
    name: "",
    slug: "",
    description: "",
    duration: 30,
    locationType: "video",
    color: "#10b981",
    maxBookingsPerDay: 10,
    bufferBefore: 0,
    bufferAfter: 0,
    timezone: "UTC",
    availability: defaultDays,
    notifications: {
      confirmationEmail: true,
      reminder24h: true,
      reminder1h: false,
      calendarInvite: true,
    },
  });

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendars/${id}`);
      if (res.ok) {
        const data: unknown = await res.json();
        const cal = (data as { data: CalendarDetail }).data ?? (data as CalendarDetail);
        setCalendar({
          ...calendar,
          ...cal,
          availability: cal.availability ?? defaultDays,
          notifications: cal.notifications ?? calendar.notifications,
        });
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/calendars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendar),
      });
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "availability", label: "Availability" },
    { key: "notifications", label: "Notifications" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-700" />
        <div className="h-64 animate-pulse rounded-xl bg-[#1e293b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/calendars"
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {calendar.name || "Edit Calendar"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-[#1e293b] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6 rounded-xl bg-[#1e293b] p-6">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input
              type="text"
              value={calendar.name}
              onChange={(e) =>
                setCalendar((c) => ({ ...c, name: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Description
            </label>
            <textarea
              value={calendar.description}
              onChange={(e) =>
                setCalendar((c) => ({ ...c, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => setCalendar((c) => ({ ...c, duration: d }))}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    calendar.duration === d
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Location
            </label>
            <div className="flex flex-wrap gap-2">
              {locationTypes.map((lt) => (
                <button
                  key={lt.value}
                  onClick={() =>
                    setCalendar((c) => ({ ...c, locationType: lt.value }))
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    calendar.locationType === lt.value
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">Color</label>
            <div className="flex gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setCalendar((c) => ({ ...c, color }))}
                  className={`h-8 w-8 rounded-full ${calendar.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e293b]" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Max bookings/day
              </label>
              <input
                type="number"
                min={1}
                value={calendar.maxBookingsPerDay}
                onChange={(e) =>
                  setCalendar((c) => ({
                    ...c,
                    maxBookingsPerDay: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Buffer before (min)
              </label>
              <input
                type="number"
                min={0}
                value={calendar.bufferBefore}
                onChange={(e) =>
                  setCalendar((c) => ({
                    ...c,
                    bufferBefore: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Buffer after (min)
              </label>
              <input
                type="number"
                min={0}
                value={calendar.bufferAfter}
                onChange={(e) =>
                  setCalendar((c) => ({
                    ...c,
                    bufferAfter: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === "availability" && (
        <div className="space-y-6 rounded-xl bg-[#1e293b] p-6">
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Timezone
            </label>
            <select
              value={calendar.timezone}
              onChange={(e) =>
                setCalendar((c) => ({ ...c, timezone: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-300">
              Weekly Schedule
            </h3>
            <div className="space-y-3">
              {calendar.availability.map((day, idx) => (
                <div
                  key={day.day}
                  className="flex items-center gap-4 rounded-lg bg-[#0f172a] p-3"
                >
                  <span className="w-24 text-sm font-medium text-slate-300">
                    {day.day}
                  </span>
                  <Toggle
                    checked={day.enabled}
                    onChange={(v) => {
                      const updated = [...calendar.availability];
                      updated[idx] = { ...updated[idx], enabled: v };
                      setCalendar((c) => ({
                        ...c,
                        availability: updated,
                      }));
                    }}
                  />
                  {day.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.start}
                        onChange={(e) => {
                          const updated = [...calendar.availability];
                          updated[idx] = {
                            ...updated[idx],
                            start: e.target.value,
                          };
                          setCalendar((c) => ({
                            ...c,
                            availability: updated,
                          }));
                        }}
                        className="rounded border border-slate-600 bg-[#1e293b] px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => {
                          const updated = [...calendar.availability];
                          updated[idx] = {
                            ...updated[idx],
                            end: e.target.value,
                          };
                          setCalendar((c) => ({
                            ...c,
                            availability: updated,
                          }));
                        }}
                        className="rounded border border-slate-600 bg-[#1e293b] px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-4 rounded-xl bg-[#1e293b] p-6">
          {[
            {
              key: "confirmationEmail" as const,
              label: "Confirmation email",
              desc: "Send a confirmation email when a booking is made",
            },
            {
              key: "reminder24h" as const,
              label: "24h reminder",
              desc: "Send a reminder 24 hours before the meeting",
            },
            {
              key: "reminder1h" as const,
              label: "1h reminder",
              desc: "Send a reminder 1 hour before the meeting",
            },
            {
              key: "calendarInvite" as const,
              label: "Calendar invite",
              desc: "Send a calendar invite (.ics) with the confirmation",
            },
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between rounded-lg bg-[#0f172a] p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {setting.label}
                </p>
                <p className="text-xs text-slate-400">{setting.desc}</p>
              </div>
              <Toggle
                checked={calendar.notifications[setting.key]}
                onChange={(v) =>
                  setCalendar((c) => ({
                    ...c,
                    notifications: { ...c.notifications, [setting.key]: v },
                  }))
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {calendar.slug && (
          <a
            href={`/${calendar.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Preview Booking Page
          </a>
        )}
      </div>
    </div>
  );
}
