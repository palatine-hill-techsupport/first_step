import { z } from "zod";

const emailAddressSchema = z.string().email();

export const bookingSchema = z.object({
  participantName: z.string().trim().min(1, "Add the name you want us to use.").max(80),
  ageBand: z.enum(["15–17", "18–25"]),
  contactMethod: z.enum(["email", "phone", "sms"]),
  email: z.string().trim().max(254).optional(),
  phone: z.string().trim().max(30).optional(),
  safeToEmail: z.boolean(),
  safeToCall: z.boolean(),
  safeToText: z.boolean(),
  safeToVoicemail: z.boolean(),
  safeContactNotes: z.string().trim().max(500, "Keep contact instructions to 500 characters or fewer.").optional(),
  supportTopics: z.array(z.string()).min(1),
  accessibilityNeeds: z.string().max(500).optional(),
  consented: z.boolean().refine((value) => value, {
    message: "Confirm that you consent to these details being used for this appointment.",
  }),
  serviceAcknowledged: z.boolean().refine((value) => value, {
    message: "Confirm that you understand this is not emergency support.",
  }),
}).superRefine((data, context) => {
  if (data.contactMethod === "email") {
    if (!data.email) {
      context.addIssue({ code: "custom", path: ["email"], message: "Add an email address." });
    } else if (!emailAddressSchema.safeParse(data.email).success) {
      context.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address." });
    }
    if (!data.safeToEmail) {
      context.addIssue({ code: "custom", path: ["safeToEmail"], message: "Confirm that it is safe to send an email." });
    }
  }

  if ((data.contactMethod === "phone" || data.contactMethod === "sms") && (data.phone?.replace(/\D/g, "").length ?? 0) < 8) {
    context.addIssue({ code: "custom", path: ["phone"], message: "Add a working phone number." });
  }
  if (data.contactMethod === "phone" && !data.safeToCall) {
    context.addIssue({ code: "custom", path: ["safeToCall"], message: "Confirm that it is safe to call this number." });
  }
  if (data.contactMethod === "sms" && !data.safeToText) {
    context.addIssue({ code: "custom", path: ["safeToText"], message: "Confirm that it is safe to send a text message." });
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
