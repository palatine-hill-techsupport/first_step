import { z } from "zod";

export const bookingSchema = z.object({
  participantName: z.string().trim().min(1, "Add the name you want us to use.").max(80),
  ageBand: z.enum(["16–17", "18–25"]),
  contactMethod: z.enum(["email", "phone", "both"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  safeToEmail: z.boolean(),
  safeToCall: z.boolean(),
  safeToVoicemail: z.boolean(),
  supportTopics: z.array(z.string()).min(1),
  accessibilityNeeds: z.string().max(500).optional(),
  consented: z.literal(true),
  serviceAcknowledged: z.literal(true),
}).superRefine((data, context) => {
  if ((data.contactMethod === "email" || data.contactMethod === "both") && !data.email) {
    context.addIssue({ code: "custom", path: ["email"], message: "Add an email address." });
  }
  if ((data.contactMethod === "phone" || data.contactMethod === "both") && (data.phone?.replace(/\D/g, "").length ?? 0) < 8) {
    context.addIssue({ code: "custom", path: ["phone"], message: "Add a working phone number." });
  }
});

export const analyticsEventSchema = z.object({
  eventName: z.enum([
    "homepage_visit", "pathway_started", "pathway_selection", "pathway_completed",
    "resource_opened", "appointment_started", "appointment_booked", "appointment_completed",
    "referral_offered", "referral_consented", "referral_sent", "referral_accepted",
    "resource_saved", "merch_waitlist", "journey_drop_off",
  ]),
  route: z.string().max(200),
  stage: z.string().max(80).optional(),
  topic: z.string().max(80).optional(),
  createdAt: z.string().datetime(),
}).strict();

export type BookingInput = z.infer<typeof bookingSchema>;
