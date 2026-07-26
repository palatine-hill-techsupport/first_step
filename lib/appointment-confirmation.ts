import type { Appointment } from "./types";

const APPOINTMENT_TIME_ZONE = "Australia/Melbourne";

const contactMethodLabels: Record<Appointment["contactMethod"], string> = {
  email: "Email",
  phone: "Phone call",
  sms: "SMS/text",
};

export interface AppointmentConfirmationTextOptions {
  appUrl?: string;
  managementUrl?: string;
}

export function buildAppointmentConfirmationText(
  appointment: Appointment,
  options: AppointmentConfirmationTextOptions = {},
) {
  const appUrl = (options.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const managementUrl = options.managementUrl
    || `${appUrl}/account/appointments?manage=${encodeURIComponent(appointment.managementToken)}`;
  const appointmentTime = new Intl.DateTimeFormat("en-AU", {
    timeZone: APPOINTMENT_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(appointment.startAt));

  return [
    `Hi ${appointment.participantName.split(/\s+/)[0]},`,
    "",
    `Thanks for booking your appointment for ${appointmentTime} (${APPOINTMENT_TIME_ZONE}).`,
    `Contact method: ${contactMethodLabels[appointment.contactMethod]}.`,
    "",
    "We’re looking forward to connecting with you.",
    "",
    "If this contact is no longer safe or suitable, use your booking management link to cancel or change it:",
    managementUrl,
    "",
    "You can read what we record, how information is used and the limits of confidentiality here:",
    `Consent: ${appUrl}/consent`,
    `Privacy: ${appUrl}/privacy`,
  ].join("\n");
}
