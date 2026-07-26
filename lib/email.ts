import { Resend } from "resend";
import type { Appointment } from "./types";
import { buildAppointmentConfirmationText } from "./appointment-confirmation";

export { buildAppointmentConfirmationText } from "./appointment-confirmation";

export interface EmailDelivery {
  sendAppointmentConfirmation(appointment: Appointment): Promise<{ id?: string; preview?: string }>;
}

export class DemoEmailDelivery implements EmailDelivery {
  async sendAppointmentConfirmation(appointment: Appointment) {
    return { preview: buildAppointmentConfirmationText(appointment) };
  }
}

export class ResendEmailDelivery implements EmailDelivery {
  private resend: Resend;
  constructor(apiKey: string, private from: string) { this.resend = new Resend(apiKey); }
  async sendAppointmentConfirmation(appointment: Appointment) {
    if (appointment.contactMethod !== "email" || !appointment.email || !appointment.safeToEmail) return {};
    const result = await this.resend.emails.send({
      from: this.from,
      to: appointment.email,
      subject: "Your first_step appointment is booked",
      text: buildAppointmentConfirmationText(appointment),
    });
    return { id: result.data?.id };
  }
}

export function createEmailDelivery(): EmailDelivery {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return key && from ? new ResendEmailDelivery(key, from) : new DemoEmailDelivery();
}
