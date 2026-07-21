import { NextResponse } from "next/server";
import { analyticsEventSchema } from "@/lib/validation";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = analyticsEventSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return NextResponse.json({ stored: false, demo: true });
  const supabase = createServiceRoleClient();
  const event = parsed.data;
  const { error } = await supabase.from("analytics_events").insert({
    event_name: event.eventName,
    route: event.route,
    stage: event.stage,
    topic: event.topic,
    created_at: event.createdAt,
  });
  if (error) return NextResponse.json({ error: "Event not stored" }, { status: 500 });
  return NextResponse.json({ stored: true });
}
