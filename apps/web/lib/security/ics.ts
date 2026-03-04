/**
 * SEC-008: ICS calendar invite generation with HTML escaping.
 * All invitee-provided data (name, email) is escaped before embedding in .ics content
 * to prevent injection of malicious content into calendar clients.
 */

import { escapeHtml, escapeIcsText } from "./escape-html";

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  organizerEmail: string;
  organizerName: string;
  inviteeEmail: string;
  inviteeName: string;
  location?: string;
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function generateIcs(event: IcsEvent): string {
  // SEC-008: Escape all user-provided strings
  const safeSummary = escapeIcsText(escapeHtml(event.summary));
  const safeDescription = event.description
    ? escapeIcsText(escapeHtml(event.description))
    : "";
  const safeInviteeName = escapeIcsText(escapeHtml(event.inviteeName));
  const safeInviteeEmail = escapeHtml(event.inviteeEmail);
  const safeOrganizerName = escapeIcsText(escapeHtml(event.organizerName));
  const safeOrganizerEmail = escapeHtml(event.organizerEmail);
  const safeLocation = event.location
    ? escapeIcsText(escapeHtml(event.location))
    : "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookingKit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTART:${formatIcsDate(event.startsAt)}`,
    `DTEND:${formatIcsDate(event.endsAt)}`,
    `SUMMARY:${safeSummary}`,
    ...(safeDescription
      ? [`DESCRIPTION:${safeDescription}`]
      : []),
    ...(safeLocation
      ? [`LOCATION:${safeLocation}`]
      : []),
    `ORGANIZER;CN=${safeOrganizerName}:mailto:${safeOrganizerEmail}`,
    `ATTENDEE;CN=${safeInviteeName};RSVP=TRUE:mailto:${safeInviteeEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
