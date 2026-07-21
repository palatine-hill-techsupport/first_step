import { describe, expect, it } from "vitest";
import { bookingSchema } from "@/lib/validation";
import {
  generateSlots,
  isDoubleBooking,
  makeIcs,
  recommendPathway,
  redactAnalyticsPayload,
  validateConsent,
  validateGuestToken,
} from "@/lib/domain";
import { resources } from "@/lib/demo-data";
import type { Appointment } from "@/lib/types";

const monday = new Date(2026, 6, 20, 0, 0, 0);

describe("availability generation", () => {
  it("generates recurring weekly slots after minimum notice", () => {
    const slots = generateSlots({ from: monday, format: "phone", minimumNoticeHours: 0, days: 2 });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].getDay()).toBe(1);
  });

  it("removes unavailable-date exceptions", () => {
    const slots = generateSlots({ from: monday, format: "phone", minimumNoticeHours: 0, days: 1, exceptions: [{ date: "2026-07-20", type: "unavailable" }] });
    expect(slots).toHaveLength(0);
  });

  it("adds one-off additional availability", () => {
    const sunday = new Date("2026-07-19T00:00:00+10:00");
    const slots = generateSlots({ from: sunday, format: "phone", minimumNoticeHours: 0, days: 1, exceptions: [{ date: "2026-07-19", type: "additional", startHour: 10, endHour: 12 }] });
    expect(slots.length).toBeGreaterThan(0);
  });

  it("keeps the configured appointment buffer", () => {
    const existing = [{ startAt: new Date(2026, 6, 20, 10, 30).toISOString(), endAt: new Date(2026, 6, 20, 11, 0).toISOString(), status: "confirmed" as const }];
    const slots = generateSlots({ from: monday, format: "phone", minimumNoticeHours: 0, days: 1, existing, bufferMinutes: 15 });
    expect(slots.map((slot) => slot.toISOString())).not.toContain(new Date(2026, 6, 20, 10, 0).toISOString());
  });

  it("detects double booking for a worker", () => {
    const existing = [{ workerId: "maya", startAt: "2026-07-20T10:00:00+10:00", endAt: "2026-07-20T10:30:00+10:00", status: "confirmed" as const }];
    expect(isDoubleBooking(existing, { workerId: "maya", startAt: "2026-07-20T10:15:00+10:00", endAt: "2026-07-20T10:45:00+10:00" })).toBe(true);
    expect(isDoubleBooking(existing, { workerId: "alex", startAt: "2026-07-20T10:15:00+10:00", endAt: "2026-07-20T10:45:00+10:00" })).toBe(false);
  });
});

describe("booking safety", () => {
  it("validates minimal booking data and consent", () => {
    const result = bookingSchema.safeParse({ participantName: "Jamie", ageBand: "18–25", contactMethod: "email", email: "jamie@example.test", phone: "", safeToEmail: true, safeToCall: false, safeToVoicemail: false, supportTopics: ["Work"], consented: true, serviceAcknowledged: true });
    expect(result.success).toBe(true);
  });

  it("requires both consent choices", () => {
    expect(validateConsent(true, false)).toBe(false);
    expect(validateConsent(true, true)).toBe(true);
  });

  it("validates guest management-token shape", () => {
    expect(validateGuestToken("short")).toBe(false);
    expect(validateGuestToken("AbcdEFGH_1234567890-abcdef")).toBe(true);
  });

  it("produces timezone-safe UTC calendar timestamps", () => {
    const appointment = { id: "a1", participantName: "Jamie", format: "phone", startAt: "2026-07-20T10:00:00+10:00", endAt: "2026-07-20T10:30:00+10:00" } as Appointment;
    const ics = makeIcs(appointment);
    expect(ics).toContain("DTSTART:20260720T000000Z");
    expect(ics).toContain("DTEND:20260720T003000Z");
  });
});

describe("pathway and analytics privacy", () => {
  it("recommends an urgent housing option first", () => {
    expect(recommendPathway("safe", resources)[0].category).toBe("Safe place tonight");
  });

  it("redacts identifiers and sensitive free text", () => {
    expect(redactAnalyticsPayload({ eventName: "pathway_started", topic: "work", email: "nope", participantName: "nope", accessibilityNeeds: "nope" })).toEqual({ eventName: "pathway_started", topic: "work" });
  });
});
