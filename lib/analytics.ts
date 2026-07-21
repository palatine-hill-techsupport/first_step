import { analyticsEventSchema } from "./validation";
import { redactAnalyticsPayload } from "./domain";

export type AnalyticsEvent = Parameters<typeof analyticsEventSchema.parse>[0];

export function prepareAnalyticsEvent(event: Record<string, unknown>) {
  return analyticsEventSchema.parse(redactAnalyticsPayload(event));
}

export async function trackEvent(event: Record<string, unknown>) {
  const safe = prepareAnalyticsEvent(event);
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && typeof window !== "undefined") {
    const existing = JSON.parse(window.localStorage.getItem("first_step_analytics") || "[]") as unknown[];
    window.localStorage.setItem("first_step_analytics", JSON.stringify([...existing.slice(-199), safe]));
    return;
  }
  await fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(safe), keepalive: true });
}
