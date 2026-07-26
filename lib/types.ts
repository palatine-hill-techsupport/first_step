export const TOPICS = [
  "Housing or somewhere safe",
  "Work",
  "Money",
  "Study or training",
  "Food or transport",
  "Resume or interviews",
  "I am not sure",
  "Something else",
] as const;

export type Topic = (typeof TOPICS)[number];
export type AppointmentFormat = "phone" | "video" | "text" | "in-person";
export type AgeBand = "15–17" | "18–25";
export type ContactMethod = "email" | "phone" | "sms";
export type Role = "participant" | "youth_worker" | "admin" | "committee";
export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "cancelled_participant"
  | "cancelled_worker"
  | "completed"
  | "no_show";

export interface Worker {
  id: string;
  slug: string;
  firstName: string;
  pronouns?: string;
  bio: string;
  supportedTopics: Topic[];
  formats: AppointmentFormat[];
  qualificationStatus: string;
  image: string;
}

export interface Appointment {
  id: string;
  managementToken: string;
  participantName: string;
  ageBand: AgeBand;
  workerId: string;
  format: AppointmentFormat;
  startAt: string;
  endAt: string;
  topics: Topic[];
  contactMethod: ContactMethod;
  email?: string;
  phone?: string;
  safeToEmail: boolean;
  safeToCall: boolean;
  safeToText: boolean;
  safeToVoicemail: boolean;
  safeContactNotes?: string;
  status: AppointmentStatus;
  accessibilityNeeds?: string;
  meetingUrl?: string;
  consentedAt: string;
}

export type ResourceStatus = "active" | "needs_review" | "archived";
export type SourceType = "verified_external" | "demonstration" | "future_partner";

export interface Resource {
  id: string;
  slug: string;
  title: string;
  organisation: string;
  summary: string;
  description: string;
  category: string;
  urgency: "urgent" | "soon" | "anytime";
  formats: Array<"online" | "phone" | "in-person">;
  age: string;
  location: string;
  cost: string;
  nextStep: string;
  contact: string;
  openingHours: string;
  website?: string;
  phone?: string;
  status: ResourceStatus;
  sourceType: SourceType;
  lastVerifiedAt: string;
  noReferral: boolean;
}

export type ReferralStatus =
  | "offered"
  | "consented"
  | "ready_to_send"
  | "sent"
  | "accepted"
  | "unable_to_contact"
  | "declined"
  | "closed";

export interface Referral {
  id: string;
  appointmentId: string;
  workerId: string;
  partnerName: string;
  partnerSummary: string;
  sharedFields: string[];
  approvedSummary: string;
  status: ReferralStatus;
  consentedAt?: string;
}

export interface DemoState {
  role: Role;
  appointments: Appointment[];
  savedResources: string[];
  savedPathways: string[];
  referrals: Referral[];
  merchWaitlist: string[];
}
