import { addDays, addMinutes, format as formatDate, isAfter, isBefore, setHours, setMinutes, startOfDay } from "date-fns";
import type { Appointment, AppointmentFormat, Resource, Topic } from "./types";

export interface AvailabilityRule {
  weekday: number;
  startHour: number;
  endHour: number;
  formats: AppointmentFormat[];
}

export interface AvailabilityException {
  date: string;
  type: "unavailable" | "additional";
  startHour?: number;
  endHour?: number;
}

export const DEFAULT_RULES: AvailabilityRule[] = [
  { weekday: 1, startHour: 10, endHour: 16, formats: ["phone", "video", "text"] },
  { weekday: 2, startHour: 12, endHour: 18, formats: ["phone", "video", "text", "in-person"] },
  { weekday: 3, startHour: 10, endHour: 16, formats: ["phone", "video", "text"] },
  { weekday: 4, startHour: 12, endHour: 19, formats: ["phone", "video", "text", "in-person"] },
  { weekday: 5, startHour: 9, endHour: 14, formats: ["phone", "video", "text"] },
];

export function generateSlots(options: {
  from: Date;
  days?: number;
  durationMinutes?: number;
  bufferMinutes?: number;
  minimumNoticeHours?: number;
  format: AppointmentFormat;
  rules?: AvailabilityRule[];
  exceptions?: AvailabilityException[];
  existing?: Pick<Appointment, "startAt" | "endAt" | "status">[];
}) {
  const {
    from,
    days = 21,
    durationMinutes = 30,
    bufferMinutes = 15,
    minimumNoticeHours = 12,
    format,
    rules = DEFAULT_RULES,
    exceptions = [],
    existing = [],
  } = options;
  const earliest = addMinutes(from, minimumNoticeHours * 60);
  const slots: Date[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(startOfDay(from), offset);
    const dateKey = formatDate(day, "yyyy-MM-dd");
    const exception = exceptions.find((item) => item.date === dateKey);
    if (exception?.type === "unavailable") continue;
    const dayRules = exception?.type === "additional"
      ? [{ weekday: day.getDay(), startHour: exception.startHour ?? 9, endHour: exception.endHour ?? 12, formats: [format] }]
      : rules.filter((rule) => rule.weekday === day.getDay() && rule.formats.includes(format));

    for (const rule of dayRules) {
      let cursor = setMinutes(setHours(day, rule.startHour), 0);
      const closes = setMinutes(setHours(day, rule.endHour), 0);
      while (!isAfter(addMinutes(cursor, durationMinutes), closes)) {
        const end = addMinutes(cursor, durationMinutes);
        const overlaps = existing.some((booking) => {
          if (booking.status.startsWith("cancelled")) return false;
          const bookedStart = addMinutes(new Date(booking.startAt), -bufferMinutes);
          const bookedEnd = addMinutes(new Date(booking.endAt), bufferMinutes);
          return isBefore(cursor, bookedEnd) && isAfter(end, bookedStart);
        });
        if (isAfter(cursor, earliest) && !overlaps) slots.push(cursor);
        cursor = addMinutes(cursor, durationMinutes + bufferMinutes);
      }
    }
  }
  return slots;
}

export function isDoubleBooking(existing: Pick<Appointment, "workerId" | "startAt" | "endAt" | "status">[], candidate: Pick<Appointment, "workerId" | "startAt" | "endAt">) {
  return existing.some((item) =>
    item.workerId === candidate.workerId &&
    !item.status.startsWith("cancelled") &&
    new Date(candidate.startAt) < new Date(item.endAt) &&
    new Date(candidate.endAt) > new Date(item.startAt),
  );
}

export function recommendPathway(selection: string, resources: Resource[]) {
  const categoryMap: Record<string, string[]> = {
    safe: ["Safe place tonight", "Family violence", "Talk to someone"],
    talk: ["Talk to someone", "General youth support"],
    work: ["Work and paid opportunities", "Money and financial stability", "Resume and interviews"],
    study: ["Study and training", "Work and paid opportunities"],
    food: ["Food and transport", "Money and financial stability"],
    resume: ["Resume and interviews", "Work and paid opportunities"],
    unsure: ["General youth support", "Talk to someone", "Study and training"],
  };
  const categories = categoryMap[selection] ?? categoryMap.unsure;
  return [...resources]
    .filter((resource) => resource.status === "active")
    .sort((a, b) => {
      const rank = (category: string) => {
        const index = categories.indexOf(category);
        return index === -1 ? Number.MAX_SAFE_INTEGER : index;
      };
      return rank(a.category) - rank(b.category);
    })
    .slice(0, 4);
}

export function redactAnalyticsPayload(payload: Record<string, unknown>) {
  const blocked = new Set(["name", "displayname", "participantname", "email", "phone", "address", "message", "notes", "summary", "accessibilityneeds", "contactdetails"]);
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !blocked.has(key.replaceAll("_", "").toLowerCase())));
}

export function validateGuestToken(token: string) {
  return /^[A-Za-z0-9_-]{24,}$/.test(token);
}

export function validateConsent(consented: boolean, acknowledgement: boolean) {
  return consented && acknowledgement;
}

export function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 32);
}

export function makeIcs(appointment: Appointment) {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//first_step//appointment//EN",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@first-step.au`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(appointment.startAt)}`,
    `DTEND:${stamp(appointment.endAt)}`,
    "SUMMARY:first_step youth-worker conversation",
    `DESCRIPTION:${appointment.format === "video" ? "Your private video link will be sent before the appointment." : "A practical conversation with a real youth worker."}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function topicsFromSelection(selection: string): Topic[] {
  const map: Record<string, Topic> = {
    safe: "Housing or somewhere safe",
    talk: "I am not sure",
    work: "Work",
    study: "Study or training",
    food: "Food or transport",
    resume: "Resume or interviews",
    unsure: "I am not sure",
  };
  return [map[selection] ?? "I am not sure"];
}
