export function generateIcs(opts: {
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  organizerEmail: string;
  attendeeEmail: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = Math.random().toString(36).slice(2) + '@bookingkit';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookingKit//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(opts.startsAt)}`,
    `DTEND:${fmt(opts.endsAt)}`,
    `SUMMARY:${opts.summary}`,
    `DESCRIPTION:${opts.description}`,
    `ORGANIZER:mailto:${opts.organizerEmail}`,
    `ATTENDEE:mailto:${opts.attendeeEmail}`,
    `UID:${uid}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
