"use client";

import type { AgeBand, Appointment, ContactMethod, DemoState, Referral, Resource, Role } from "./types";
import { seedReferrals } from "./demo-data";

export interface FirstStepRepository {
  getState(): DemoState;
  setRole(role: Role): DemoState;
  saveResource(slug: string): DemoState;
  savePathway(id: string): DemoState;
  createAppointment(appointment: Appointment): DemoState;
  updateAppointment(id: string, patch: Partial<Appointment>): DemoState;
  updateReferral(id: string, patch: Partial<Referral>): DemoState;
  joinMerchWaitlist(email: string): DemoState;
}

const STORAGE_KEY = "first_step_demo_state_v1";

type LegacyAppointment = Omit<Appointment, "ageBand" | "contactMethod" | "safeToText"> & {
  ageBand: AgeBand | "16–17";
  contactMethod: ContactMethod | "both";
  safeToText?: boolean;
};

const initialState = (): DemoState => ({
  role: "participant",
  appointments: [],
  savedResources: [],
  savedPathways: [],
  referrals: seedReferrals,
  merchWaitlist: [],
});

function normaliseAppointment(appointment: LegacyAppointment): Appointment {
  const contactMethod: ContactMethod = appointment.contactMethod === "both"
    ? appointment.email ? "email" : "phone"
    : appointment.contactMethod;
  return {
    ...appointment,
    ageBand: appointment.ageBand === "16–17" ? "15–17" : appointment.ageBand,
    contactMethod,
    safeToText: appointment.safeToText ?? false,
  };
}

export class DemoRepository implements FirstStepRepository {
  private read(): DemoState {
    if (typeof window === "undefined") return initialState();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState();
    try {
      const parsed = JSON.parse(saved) as Partial<Omit<DemoState, "appointments">> & { appointments?: LegacyAppointment[] };
      return {
        ...initialState(),
        ...parsed,
        appointments: (parsed.appointments ?? []).map(normaliseAppointment),
      };
    } catch {
      return initialState();
    }
  }

  private write(state: DemoState) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("first-step-state", { detail: state }));
    return state;
  }

  getState() { return this.read(); }
  setRole(role: Role) { return this.write({ ...this.read(), role }); }
  saveResource(slug: string) {
    const state = this.read();
    return this.write({ ...state, savedResources: Array.from(new Set([...state.savedResources, slug])) });
  }
  savePathway(id: string) {
    const state = this.read();
    return this.write({ ...state, savedPathways: Array.from(new Set([...state.savedPathways, id])) });
  }
  createAppointment(appointment: Appointment) {
    const state = this.read();
    return this.write({ ...state, appointments: [...state.appointments, appointment] });
  }
  updateAppointment(id: string, patch: Partial<Appointment>) {
    const state = this.read();
    return this.write({ ...state, appointments: state.appointments.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }
  updateReferral(id: string, patch: Partial<Referral>) {
    const state = this.read();
    return this.write({ ...state, referrals: state.referrals.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }
  joinMerchWaitlist(email: string) {
    const state = this.read();
    return this.write({ ...state, merchWaitlist: Array.from(new Set([...state.merchWaitlist, email])) });
  }
}

export class SupabaseRepository implements FirstStepRepository {
  constructor() {
    throw new Error("Use the server-side Supabase adapter in production mode. See lib/supabase/server.ts.");
  }
  getState(): DemoState { throw new Error("Unavailable in the browser"); }
  setRole(): DemoState { throw new Error("Roles are managed server-side"); }
  saveResource(): DemoState { throw new Error("Use server action"); }
  savePathway(): DemoState { throw new Error("Use server action"); }
  createAppointment(): DemoState { throw new Error("Use server action"); }
  updateAppointment(): DemoState { throw new Error("Use server action"); }
  updateReferral(): DemoState { throw new Error("Use server action"); }
  joinMerchWaitlist(): DemoState { throw new Error("Use server action"); }
}

export const demoRepository = new DemoRepository();

export function isDemoResource(resource: Resource) {
  return resource.sourceType !== "verified_external";
}
