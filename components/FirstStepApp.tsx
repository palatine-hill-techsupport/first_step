"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bookmark,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  Eye,
  FileDown,
  GraduationCap,
  HeartHandshake,
  House,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrainFront,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { addDays, addMinutes, format, formatISO } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { resources, urgentResources, workers } from "@/lib/demo-data";
import { demonstrationReport, reportCurrency, reportPercent } from "@/lib/demo-report";
import { generateSlots, makeIcs, makeToken, recommendPathway, topicsFromSelection } from "@/lib/domain";
import { demoRepository } from "@/lib/repository";
import { TOPICS } from "@/lib/types";
import type { Appointment, AppointmentFormat, DemoState, Resource, Role, Topic } from "@/lib/types";

const navigation = [
  ["Home", "/"],
  ["Start here", "/start?restart=1"],
  ["Book a session", "/book"],
  ["Useful now", "/resources"],
  ["About", "/about"],
] as const;

type SupportTopic = Topic | "Somewhere safe" | "Talk to someone";

const supportTopicIcons: Record<SupportTopic, LucideIcon> = {
  "Somewhere safe": House,
  "Housing or somewhere safe": House,
  "Talk to someone": MessageCircle,
  Work: BriefcaseBusiness,
  Money: Banknote,
  "Study or training": GraduationCap,
  "Food or transport": TrainFront,
  "Resume or interviews": BookOpen,
  "I am not sure": Sparkles,
  "Something else": CircleHelp,
};

function SupportTopicIcon({ topic }: { topic: string }) {
  const Icon = supportTopicIcons[topic as SupportTopic] ?? CircleHelp;
  return <Icon aria-hidden="true" />;
}

function isNavigationActive(pathname: string, href: string) {
  if (href.startsWith("/start")) return pathname === "/start" || pathname.startsWith("/pathways/");
  if (href === "/resources") return pathname === "/resources" || pathname.startsWith("/resources/");
  return pathname === href;
}

const formatLabels: Record<AppointmentFormat, string> = {
  phone: "Phone",
  video: "Video",
  text: "Scheduled text chat",
  "in-person": "In person",
};

function useDemoState() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<DemoState>({
    role: "participant",
    appointments: [],
    savedResources: [],
    savedPathways: [],
    referrals: [],
    merchWaitlist: [],
  });
  useEffect(() => {
    setState(demoRepository.getState());
    setHydrated(true);
    const sync = (event: Event) => setState((event as CustomEvent<DemoState>).detail ?? demoRepository.getState());
    window.addEventListener("first-step-state", sync);
    return () => window.removeEventListener("first-step-state", sync);
  }, []);
  return { state, setState, hydrated };
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand-logo" href="/" aria-label="first_step home">
      <img src={compact ? "/brand/first_step_logo-lettermark.svg" : "/brand/first_step_logo.svg"} alt="first_step" />
    </a>
  );
}

export function QuickExit() {
  const exitUrl = process.env.NEXT_PUBLIC_QUICK_EXIT_URL || "https://www.youtube.com/shorts";
  return <button className="quick-exit" aria-label="Quick exit to YouTube Shorts" onClick={() => window.location.replace(exitUrl)}><ExternalLink size={17} /> Quick exit</button>;
}

export function ServiceStatus({ compact = false }: { compact?: boolean }) {
  const serviceOpen = (process.env.NEXT_PUBLIC_SERVICE_STATUS || "open") === "open";
  return (
    <div className={`service-status ${serviceOpen ? "is-open" : "is-closed"}`}>
      <span aria-hidden="true" />
      <strong>{serviceOpen ? "Bookings open" : "Service currently closed"}</strong>
      {!compact && <span>{serviceOpen ? "Messages checked Mon–Fri, 9am–6pm" : "You can still book a time. Messages are checked during response hours."}</span>}
    </div>
  );
}

export function DemoModeBanner() {
  return (
    <div className="demo-banner" role="note">
      <span><strong>Demonstration pilot.</strong> Bookings and dashboards use sample data on this device.</span>
      <a href="/demo">See demo roles <ArrowRight size={15} /></a>
    </div>
  );
}

export function UrgentSupportBanner({ full = false }: { full?: boolean }) {
  return (
    <section className={full ? "urgent-panel" : "urgent-strip"} aria-labelledby={full ? "urgent-heading" : undefined}>
      <div>
        <span className="eyebrow urgent"><AlertTriangle size={16} /> Need help now?</span>
        {full ? <h2 id="urgent-heading">You do not need to finish a quiz.</h2> : <strong>Need somewhere safe tonight?</strong>}
        <p>first_step is not an emergency or 24-hour service.</p>
      </div>
      <div className="urgent-actions">
        <a className="button button-red" href="tel:1800825955">Call housing support <span>1800 825 955</span></a>
        <a className="button button-light" href="/pathways/safe-tonight">See all urgent options</a>
      </div>
    </section>
  );
}

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  return (
    <>
      <header className="app-header">
        <BrandLogo />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(([label, href]) => <a key={href} href={href} aria-current={isNavigationActive(pathname, href) ? "page" : undefined}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <QuickExit />
          <a className="button button-black header-book" href="/book">Talk to someone</a>
          <button className="menu-button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu /></button>
        </div>
      </header>
      <MobileNavigation open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || "/";
  if (!open) return null;
  return (
    <div className="mobile-nav-backdrop" role="presentation" onClick={onClose}>
      <nav className="mobile-nav" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}>
        <button aria-label="Close menu" onClick={onClose}><X /></button>
        {navigation.map(([label, href]) => <a key={href} href={href} aria-current={isNavigationActive(pathname, href) ? "page" : undefined}>{label}<ChevronRight /></a>)}
        <a href="/pathways/safe-tonight" className="urgent-link">Need somewhere safe tonight?</a>
        <a href="/account">My account</a>
        <ServiceStatus />
      </nav>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand"><BrandLogo /><p>Take one useful step.<br />Come back when you need the next.</p></div>
        <div><h2>Get help</h2><a href="/start">Choose a first step</a><a href="/book">Book a youth worker</a><a href="/resources">Browse useful options</a><a href="/safety">Urgent support</a></div>
        <div><h2>About</h2><a href="/about">How it works</a><a href="/partners">Partners</a><a href="/impact">Pilot impact</a><a href="/impact-dashboard">Partner impact demo</a><a href="/merch">Drop 001</a></div>
        <div><h2>The small print, plainly</h2><a href="/privacy">Privacy</a><a href="/consent">Consent</a><a href="/terms">Terms & service status</a><a href="/demo">Demo mode</a></div>
      </div>
      <div className="footer-boundary">
        <ShieldCheck />
        <p><strong>first_step is a bridge, not an emergency service.</strong> Call 000 if someone is in immediate danger. We connect young people to qualified workers and existing services.</p>
        <QuickExit />
      </div>
      <p className="acknowledgement">first_step acknowledges the Traditional Owners of Country throughout Victoria and pays respect to Elders past and present.</p>
    </footer>
  );
}

export function PathwayCard({ icon, title, copy, href, tone = "cream" }: { icon: ReactNode; title: string; copy: string; href: string; tone?: string }) {
  return <a className={`pathway-card tone-${tone}`} href={href}><span className="pathway-icon">{icon}</span><h3>{title}</h3><p>{copy}</p><span className="card-link">See a useful next step <ArrowRight /></span></a>;
}

function SourceBadge({ resource }: { resource: Resource }) {
  if (resource.sourceType === "verified_external") return <span className="source-badge verified"><BadgeCheck /> External details checked</span>;
  if (resource.sourceType === "future_partner") return <span className="source-badge future">Future partner example</span>;
  return <span className="source-badge demo">Demonstration content</span>;
}

export function ResourceCard({ resource, saved, onSave }: { resource: Resource; saved?: boolean; onSave?: () => void }) {
  const urgentCallLabels: Record<string, string> = {
    "victoria-homelessness-support": "Call 1800 825 955",
    "kids-helpline": "Call Kids Helpline",
    "1800respect": "Call 1800RESPECT",
    lifeline: "Call Lifeline",
  };
  const urgentCallLabel = resource.sourceType === "verified_external" && resource.phone ? urgentCallLabels[resource.slug] : undefined;
  return (
    <article className="resource-card">
      <div className="resource-meta"><SourceBadge resource={resource} /><span>{resource.category}</span></div>
      <h3><a href={`/resources/${resource.slug}`}>{resource.title}</a></h3>
      <p>{resource.summary}</p>
      <dl className="quick-facts"><div><dt>Cost</dt><dd>{resource.cost}</dd></div><div><dt>Contact</dt><dd>{resource.contact}</dd></div><div><dt>Available</dt><dd>{resource.openingHours}</dd></div></dl>
      <div className="card-actions">{urgentCallLabel && <a className="button button-red" href={`tel:${resource.phone}`}><Phone /> {urgentCallLabel}</a>}<a className={`button ${urgentCallLabel ? "button-light" : "button-black"}`} href={`/resources/${resource.slug}`}>View details <ArrowRight /></a>{onSave && <button className="icon-button" onClick={onSave} aria-label={`Save ${resource.title}`}><Bookmark /> {saved ? "Saved" : "Save"}</button>}</div>
      <small>Information checked {format(new Date(`${resource.lastVerifiedAt}T12:00:00`), "d MMMM yyyy")}</small>
    </article>
  );
}

export function MascotPrompt({ children }: { children: ReactNode }) {
  return <aside className="mascot-prompt"><img src="/brand/first_step_mascot.svg" alt="" /><div>{children}</div></aside>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><img src="/brand/first_step_mascot.svg" alt="" /><h3>{title}</h3><p>{children}</p>{action}</div>;
}

export function ErrorState({ children }: { children: ReactNode }) { return <div className="error-state" role="alert"><AlertTriangle />{children}</div>; }
export function LoadingState() { return <div className="loading-state" aria-live="polite"><span />Loading useful options…</div>; }

function PageIntro({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children?: ReactNode }) {
  return <section className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p>{children}</section>;
}

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="sticker">Start where you are.</span>
          <h1>The hardest step is always the <em>first.</em></h1>
          <p>Find a practical next step into support, study, work or stability. No life story required.</p>
          <div className="hero-actions"><a className="button button-mint" href="/start">I need a first step <ArrowRight /></a><a className="button button-light" href="/book">Book a youth worker</a></div>
          <a className="text-link urgent-text" href="/pathways/safe-tonight"><AlertTriangle /> I need somewhere safe tonight</a>
        </div>
        <div className="hero-art" aria-label="Melbourne, Victoria">
          <img src="/images/fs_img_1.jpg" alt="Melbourne skyline viewed across local neighbourhoods" />
          <div className="hero-note"><strong>Practical help.<br />No proof required.</strong><img src="/brand/first_step_mascot.svg" alt="" /></div>
        </div>
      </section>
      <UrgentSupportBanner />
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">Pick what feels useful</span><h2>What would make today easier?</h2></div><p>No assessment. No wrong door. Choose one thing.</p></div>
        <div className="pathway-grid">
          <PathwayCard icon={<SupportTopicIcon topic="Somewhere safe" />} title="Somewhere safe" copy="Housing help for tonight or the next few weeks." href="/pathways/safe-tonight" tone="red" />
          <PathwayCard icon={<SupportTopicIcon topic="Talk to someone" />} title="Talk to someone" copy="Book a real youth worker. Phone, video, text or in person." href="/pathways/talk" tone="mint" />
          <PathwayCard icon={<SupportTopicIcon topic="Work" />} title="Work" copy="Paid opportunities, résumés and interview support." href="/pathways/work" tone="yellow" />
          <PathwayCard icon={<SupportTopicIcon topic="Study or training" />} title="Study or training" copy="TAFE, VCE VM and practical training options." href="/pathways/study" />
          <PathwayCard icon={<SupportTopicIcon topic="Money" />} title="Money" copy="Bills, concessions and financial counselling paths." href="/pathways/money" tone="navy" />
          <PathwayCard icon={<SupportTopicIcon topic="Food or transport" />} title="Food or transport" copy="Useful local help without a long form." href="/pathways/food-transport" />
        </div>
        <div className="center-action"><a className="button button-black" href="/start">Not sure? Start with one question</a></div>
      </section>
      <section className="how-section section dark-section">
        <div className="section-heading"><div><span className="eyebrow light">Less pressure. More useful.</span><h2>How first_step works</h2></div></div>
        <ol className="step-list"><li><span>01</span><h3>Choose a direction</h3><p>Pick what would make today easier. You do not need to explain why.</p></li><li><span>02</span><h3>See real options</h3><p>Know the cost, contact, opening hours and what happens next.</p></li><li><span>03</span><h3>Talk if you want</h3><p>A qualified youth worker can help make the next connection.</p></li></ol>
      </section>
      <section className="conversation-section section">
        <div className="conversation-image"><img src="/images/fs_youth-worker.jpg" alt="A youth worker named Maya holding a notebook" /><span className="photo-label">Demo worker profile</span></div>
        <div><span className="eyebrow">A real conversation</span><h2>Talk to a person.<br />Not a bot.</h2><p>Maya and the demonstration worker team offer scheduled 30-minute conversations. Bring one question. Or say you are not sure yet.</p><ul className="check-list"><li><Check /> Phone, video, scheduled text or in person</li><li><Check /> No diagnosis or detailed history required</li><li><Check /> A warm referral only happens with your consent</li></ul><a className="button button-mint" href="/book">Find a time <ArrowRight /></a></div>
      </section>
      <section className="section useful-preview"><div className="section-heading"><div><span className="eyebrow">Bluntly useful</span><h2>Useful now</h2></div><a className="text-link" href="/resources">See every option <ArrowRight /></a></div><div className="resource-grid">{resources.slice(0, 3).map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div></section>
      <section className="partner-strip section"><div className="partner-copy"><span className="eyebrow">Partnership over ego</span><h2>Good services already exist.</h2><p>first_step coordinates the roads between youth workers, education providers, social enterprises and specialist support. Their wins are our wins.</p><a className="button button-light" href="/partners">How partnership works</a></div><div className="partner-model" aria-label="How partners contribute"><article><UsersRound /><div><strong>Qualified youth workers</strong><span>Practical conversations and safe connections.</span></div></article><article><GraduationCap /><div><strong>TAFE and VCE VM</strong><span>Real learning and training pathways.</span></div></article><article><BriefcaseBusiness /><div><strong>Social enterprises</strong><span>Paid work and lawful placements.</span></div></article><article><HeartHandshake /><div><strong>Specialist youth services</strong><span>Housing, safety, health and expert support.</span></div></article></div></section>
      <section className="section values-section"><div className="section-heading"><div><span className="eyebrow">Our operating rules</span><h2>Useful. Honest. Human.</h2></div></div><div className="values-grid"><article><span>01</span><h3>Dignity without disclosure</h3><p>You do not need to prove things are bad enough.</p></article><article><span>02</span><h3>All work is paid work</h3><p>Productive labour is paid or a lawful, structured placement.</p></article><article><span>03</span><h3>Practicality over performance</h3><p>Do something useful today. Skip the corporate speech.</p></article><article><span>04</span><h3>Partnership over ego</h3><p>Existing services keep the credit for the work they do.</p></article><article><span>05</span><h3>Small enough to test</h3><p>This is a transparent pilot, not a pretend national service.</p></article></div></section>
      <section className="section split-promos"><a className="event-promo" href="/demo"><span>Demo pop-up · August 2026</span><h2>See the pilot in action.</h2><p>Try a guided pathway, book a sample time and inspect each role.</p><ArrowRight /></a><a className="merch-promo" href="/merch"><span>Drop 001</span><h2>Wear the first step.</h2><img src="/brand/MerchMocks/black-tee.png" alt="Black first_step heavyweight t-shirt" /><p>Five small-batch pieces. Register interest, no pretend checkout.</p></a></section>
      <section className="impact-preview section"><div><span className="eyebrow">Demonstration pilot data</span><h2>Measure the bridge.<br />Protect the person.</h2><p>We count completed steps, not private stories. Sponsors receive aggregate results only.</p><a className="button button-black" href="/impact">See what we measure</a></div><div><p className="impact-demo-note"><strong>Demonstration pilot data.</strong> These figures show how pilot reporting could work; they are not real first_step outcomes.</p><div className="impact-numbers"><ImpactMetric value="68%" label="Pathways completed" /><ImpactMetric value="42%" label="Booking conversion" /><ImpactMetric value="76%" label="Appointments attended" /><ImpactMetric value="61%" label="Referrals accepted" /></div></div></section>
    </>
  );
}

const pathwayOptions: ReadonlyArray<readonly [string, string, SupportTopic]> = [
  ["safe", "I need somewhere safe", "Housing or somewhere safe"],
  ["talk", "I want to talk to someone", "Talk to someone"],
  ["work", "I need help with work or money", "Work"],
  ["study", "I want to study or train", "Study or training"],
  ["food", "I need food or transport help", "Food or transport"],
  ["resume", "I need résumé or interview help", "Resume or interviews"],
  ["unsure", "I am not sure yet", "I am not sure"],
  ["other", "Something else", "Something else"],
] as const;

function GuidedPathway({ state }: { state: DemoState }) {
  const searchParams = useSearchParams();
  const restartRequested = searchParams.get("restart") === "1";
  const interacted = useRef(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [selection, setSelection] = useState<string>("");
  const [mode, setMode] = useState<"options" | "talk" | "">("");
  const [formatPreference, setFormatPreference] = useState("Any format");
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (restartRequested) {
      interacted.current = true;
      window.localStorage.removeItem("first_step_pathway_progress");
      setSelection("");
      setMode("");
      setFormatPreference("Any format");
      setStep(1);
      window.history.replaceState({}, "", "/start");
    } else {
      const saved = window.localStorage.getItem("first_step_pathway_progress");
      if (saved && !interacted.current) {
      try { const data = JSON.parse(saved) as { selection?: string; step?: number }; setSelection(data.selection || ""); setStep(data.step || 1); } catch { /* start clean */ }
      }
    }
    setProgressLoaded(true);
  }, [restartRequested]);
  useEffect(() => { if (selection) window.localStorage.setItem("first_step_pathway_progress", JSON.stringify({ selection, step })); }, [selection, step]);
  const choose = (value: string) => { interacted.current = true; setSelection(value); setStep(value === "safe" ? 99 : 2); };
  const results = recommendPathway(selection, resources);
  const restart = () => { setSelection(""); setMode(""); setStep(1); window.localStorage.removeItem("first_step_pathway_progress"); };
  const save = () => demoRepository.savePathway(`${selection}-${formatPreference}`);
  return (
    <div className="task-page">
      <PageIntro eyebrow="Choose a direction" title="What would make today a little easier?" copy="Pick the closest option. This is not an assessment, and you can change your mind." />
      {step > 1 && <div className="pathway-reset"><span>Exploring a different option?</span><button type="button" onClick={restart}>Restart this guide</button></div>}
      {step !== 99 && <div className="progress-bar" role="progressbar" aria-label="Guided pathway progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={Math.min(step, 3)}><span style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} /></div>}
      {step === 1 && <div className="choice-grid">{pathwayOptions.map(([value, label, topic]) => <button disabled={!progressLoaded} key={value} onClick={() => choose(value)}><SupportTopicIcon topic={topic} /><span>{label}</span><ChevronRight /></button>)}</div>}
      {step === 99 && <><UrgentSupportBanner full /><div className="urgent-resource-grid">{urgentResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div><div className="flow-actions"><button className="button button-light" onClick={restart}>Start again</button><a className="button button-black" href="/resources">Keep browsing</a></div></>}
      {step === 2 && <div className="question-card"><button className="back-button" onClick={() => setStep(1)}><ChevronLeft /> Back</button><span className="eyebrow">One more choice</span><h2>Would you rather see options now or talk to someone?</h2><div className="two-choice"><button onClick={() => { setMode("options"); setStep(3); }}><Eye /><strong>Show me options</strong><span>Browse without giving contact details.</span></button><button onClick={() => { setMode("talk"); setStep(3); }}><MessageCircle /><strong>Talk to someone</strong><span>Find a scheduled 30-minute appointment.</span></button></div></div>}
      {step === 3 && <div className="question-card"><button className="back-button" onClick={() => setStep(2)}><ChevronLeft /> Back</button><span className="eyebrow">Last choice</span><h2>What format would be easiest?</h2><div className="format-pills">{["Any format", "Online", "Phone", "In person"].map((item) => <button className={formatPreference === item ? "selected" : ""} key={item} onClick={() => setFormatPreference(item)}>{item}</button>)}</div><button className="button button-black" onClick={() => setStep(4)}>Show my next step <ArrowRight /></button></div>}
      {step === 4 && <section className="results-screen" aria-live="polite"><span className="eyebrow">Your strongest next step</span><div className="strong-result"><div><SourceBadge resource={results[0]} /><h2>{results[0]?.title}</h2><p>{results[0]?.summary}</p><a className="button button-mint" href={mode === "talk" ? `/book?topic=${selection}` : `/resources/${results[0]?.slug}`}>{mode === "talk" ? "Talk to someone" : "See what happens next"} <ArrowRight /></a></div><img src="/brand/first_step_mascot.svg" alt="" /></div><h3>Other useful options</h3><div className="resource-grid compact">{results.slice(1).map((resource) => <ResourceCard key={resource.id} resource={resource} saved={state.savedResources.includes(resource.slug)} onSave={() => demoRepository.saveResource(resource.slug)} />)}</div><div className="flow-actions"><button className="button button-light" onClick={save}><Bookmark /> Save these steps</button><button className="button button-light" onClick={() => window.print()}><FileDown /> Print or share</button><button className="text-link" onClick={restart}>Start again</button></div></section>}
    </div>
  );
}

export function BookingStepper({ step }: { step: number }) {
  const labels = ["Topic", "Format", "Worker", "Time", "Details", "Done"];
  return <><div className="booking-mobile-progress" role="status"><strong>Step {step} of 6</strong><span>{labels[step - 1]}</span><div aria-hidden="true"><i style={{ width: `${(step / 6) * 100}%` }} /></div></div><ol className="booking-stepper" aria-label="Booking progress">{labels.map((label, index) => <li key={label} className={step >= index + 1 ? "active" : ""} aria-current={step === index + 1 ? "step" : undefined}><span>{step > index + 1 ? <Check /> : index + 1}</span><small>{label}</small></li>)}</ol></>;
}

export function WorkerCard({ worker, selected, onSelect }: { worker: typeof workers[number]; selected: boolean; onSelect: () => void }) {
  return <button className={`worker-card ${selected ? "selected" : ""}`} onClick={onSelect}><img src={worker.image} alt="" /><div><div className="worker-name"><strong>{worker.firstName}</strong>{worker.pronouns && <span>{worker.pronouns}</span>}</div><p>{worker.bio}</p><small><BadgeCheck /> {worker.qualificationStatus}</small></div>{selected && <CheckCircle2 />}</button>;
}

export function AppointmentCalendar({ slots, selected, onSelect }: { slots: Date[]; selected?: Date; onSelect: (slot: Date) => void }) {
  const days = Array.from(new Set(slots.map((slot) => format(slot, "yyyy-MM-dd")))).slice(0, 5);
  const [day, setDay] = useState(days[0] || "");
  const activeDay = days.includes(day) ? day : days[0] || "";
  return <div className="appointment-calendar"><div className="date-tabs">{days.map((date) => <button className={activeDay === date ? "selected" : ""} onClick={() => setDay(date)} key={date}><strong>{format(new Date(`${date}T12:00:00`), "EEE")}</strong><span>{format(new Date(`${date}T12:00:00`), "d MMM")}</span></button>)}</div><SlotPicker slots={slots.filter((slot) => format(slot, "yyyy-MM-dd") === activeDay)} selected={selected} onSelect={onSelect} /></div>;
}

export function SlotPicker({ slots, selected, onSelect }: { slots: Date[]; selected?: Date; onSelect: (slot: Date) => void }) {
  if (!slots.length) return <EmptyState title="No times are showing right now.">You can request a callback or check again later.</EmptyState>;
  return <div className="slot-grid">{slots.map((slot) => <button key={slot.toISOString()} className={selected?.toISOString() === slot.toISOString() ? "selected" : ""} onClick={() => onSelect(slot)}>{format(slot, "h:mm a")}</button>)}</div>;
}

export function ConsentSummary() {
  return <aside className="consent-summary"><ShieldCheck /><div><h3>What we collect — and why</h3><p>Your chosen name, age band and safe contact details help us run this appointment. The assigned worker and authorised admins can see them. Sponsors cannot.</p><a href="/privacy">Read the plain-language privacy summary</a></div></aside>;
}

function BookingPage({ state }: { state: DemoState }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const queryTopic = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("topic") : null;
  const [topics, setTopics] = useState<Topic[]>(queryTopic ? topicsFromSelection(queryTopic) : []);
  const [appointmentFormat, setAppointmentFormat] = useState<AppointmentFormat>("phone");
  const [workerId, setWorkerId] = useState("first-available");
  const [slot, setSlot] = useState<Date>();
  const [form, setForm] = useState({ name: "", ageBand: "18–25" as "16–17" | "18–25", contactMethod: "email" as "email" | "phone" | "both", email: "", phone: "", suburb: "", accessibility: "", safeEmail: true, safeCall: false, safeVoicemail: false, consent: false, acknowledge: false });
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Appointment>();
  const availableSlots = useMemo(() => generateSlots({ from: new Date(), format: appointmentFormat, existing: state.appointments }), [appointmentFormat, state.appointments]);
  const toggleTopic = (topic: Topic) => setTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  const next = () => { setError(""); if (step === 1 && !topics.length) return setError("Choose at least one topic. ‘I am not sure’ is completely fine."); if (step === 4 && !slot) return setError("Choose a time to continue."); setStep((current) => Math.min(6, current + 1)); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Add the name you want us to use.");
    if (!form.consent || !form.acknowledge) return setError("Please confirm consent and the service-hours acknowledgement.");
    if ((form.contactMethod === "email" || form.contactMethod === "both") && !/^\S+@\S+\.\S+$/.test(form.email)) return setError("Add a working email address, or choose phone.");
    if ((form.contactMethod === "phone" || form.contactMethod === "both") && form.phone.replace(/\D/g, "").length < 8) return setError("Add a working phone number, or choose email.");
    const start = slot || availableSlots[0];
    const appointment: Appointment = {
      id: `appt-${Date.now()}`,
      managementToken: makeToken(),
      participantName: form.name.trim(),
      ageBand: form.ageBand,
      workerId: workerId === "first-available" ? workers[0].id : workerId,
      format: appointmentFormat,
      startAt: formatISO(start),
      endAt: formatISO(addMinutes(start, 30)),
      topics,
      contactMethod: form.contactMethod,
      email: form.email || undefined,
      phone: form.phone || undefined,
      safeToEmail: form.safeEmail,
      safeToCall: form.safeCall,
      safeToVoicemail: form.safeVoicemail,
      status: "confirmed",
      accessibilityNeeds: form.accessibility || undefined,
      consentedAt: new Date().toISOString(),
    };
    demoRepository.createAppointment(appointment);
    setConfirmation(appointment);
    setStep(6);
  };
  const downloadCalendar = () => {
    if (!confirmation) return;
    const blob = new Blob([makeIcs(confirmation)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "first_step-appointment.ics"; anchor.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="task-page booking-page">
      <PageIntro eyebrow="Book a real conversation" title="Let’s find a time that works." copy="A 30-minute conversation. No detailed history required. This service is not monitored 24/7." />
      <BookingStepper step={step} />
      {error && <ErrorState>{error}</ErrorState>}
      {step === 1 && <section className="booking-panel"><fieldset className="topic-fieldset"><legend>What would you like to talk about?</legend><p>Choose as many broad topics as you need.</p><div className="check-choice-grid">{TOPICS.map((topic) => <label key={topic} className={topics.includes(topic) ? "selected" : ""}><input type="checkbox" checked={topics.includes(topic)} onChange={() => toggleTopic(topic)} /><span className="topic-choice-icon"><SupportTopicIcon topic={topic} /></span><span>{topic}</span><Check aria-hidden="true" /></label>)}</div><p className="selection-status" aria-live="polite">{topics.length ? `${topics.length} topic${topics.length === 1 ? "" : "s"} selected` : "No topics selected yet"}</p></fieldset><FlowButtons step={step} next={next} /></section>}
      {step === 2 && <section className="booking-panel"><h2>How would you like to talk?</h2><div className="format-choice-grid">{([{ id: "phone", icon: <Phone />, copy: "We call your safe number at the booked time." }, { id: "video", icon: <Video />, copy: "A private link is sent before the appointment." }, { id: "text", icon: <MessageCircle />, copy: "A secure thread opens shortly before your time." }, { id: "in-person", icon: <MapPin />, copy: "Meet at a listed pilot location." }] as const).map((item) => <button key={item.id} className={appointmentFormat === item.id ? "selected" : ""} onClick={() => setAppointmentFormat(item.id)}>{item.icon}<strong>{formatLabels[item.id]}</strong><span>{item.copy}</span>{appointmentFormat === item.id && <CheckCircle2 />}</button>)}</div>{appointmentFormat === "text" && <p className="inline-note"><Clock3 /> Scheduled chat is with a real worker, not a bot. It is checked only during response hours.</p>}<FlowButtons step={step} next={next} back={() => setStep(1)} /></section>}
      {step === 3 && <section className="booking-panel"><h2>Choose a worker — or first available.</h2><button className={`first-available ${workerId === "first-available" ? "selected" : ""}`} onClick={() => setWorkerId("first-available")}><UsersRound /><div><strong>First available</strong><span>Usually the quickest option. We match by topic and format.</span></div>{workerId === "first-available" && <CheckCircle2 />}</button><div className="worker-list">{workers.filter((worker) => worker.formats.includes(appointmentFormat)).map((worker) => <WorkerCard key={worker.id} worker={worker} selected={workerId === worker.id} onSelect={() => setWorkerId(worker.id)} />)}</div><FlowButtons step={step} next={next} back={() => setStep(2)} /></section>}
      {step === 4 && <section className="booking-panel"><h2>Choose a date and time.</h2><p>Times are in Australia/Melbourne. Slots include a 15-minute worker buffer.</p><AppointmentCalendar slots={availableSlots} selected={slot} onSelect={setSlot} /><FlowButtons step={step} next={next} back={() => setStep(3)} /></section>}
      {step === 5 && <form className="booking-panel details-form" onSubmit={submit} noValidate><h2>Just enough detail to run the appointment.</h2><ConsentSummary /><div className="form-grid"><label><span>Name you want us to use *</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="given-name" /></label><label><span>Age band *</span><select value={form.ageBand} onChange={(event) => setForm({ ...form, ageBand: event.target.value as typeof form.ageBand })}><option>16–17</option><option>18–25</option></select></label><label><span>Preferred contact method *</span><select value={form.contactMethod} onChange={(event) => setForm({ ...form, contactMethod: event.target.value as typeof form.contactMethod })}><option value="email">Email</option><option value="phone">Phone</option><option value="both">Both</option></select></label>{form.contactMethod !== "phone" && <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" /></label>}{form.contactMethod !== "email" && <label><span>Phone</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} autoComplete="tel" /></label>}<label><span>Suburb or postcode (optional)</span><input value={form.suburb} onChange={(event) => setForm({ ...form, suburb: event.target.value })} /></label><label className="full"><span>Accessibility or communication needs (optional)</span><textarea value={form.accessibility} onChange={(event) => setForm({ ...form, accessibility: event.target.value })} rows={3} /><small>This is sent only with this booking and is not saved in an unfinished draft.</small></label></div><fieldset><legend>Safe contact choices</legend><label className="check-row"><input type="checkbox" checked={form.safeEmail} onChange={(event) => setForm({ ...form, safeEmail: event.target.checked })} /> It is safe to send an email</label><label className="check-row"><input type="checkbox" checked={form.safeCall} onChange={(event) => setForm({ ...form, safeCall: event.target.checked })} /> It is safe to call</label><label className="check-row"><input type="checkbox" checked={form.safeVoicemail} onChange={(event) => setForm({ ...form, safeVoicemail: event.target.checked })} /> It is safe to leave a voicemail</label></fieldset><fieldset><legend>Consent</legend><label className="check-row important"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /> I consent to first_step using these details to arrange and run this appointment.</label><label className="check-row important"><input type="checkbox" checked={form.acknowledge} onChange={(event) => setForm({ ...form, acknowledge: event.target.checked })} /> I understand first_step is not monitored 24/7 and is not emergency support.</label></fieldset><FlowButtons step={step} next={next} back={() => setStep(4)} submit /></form>}
      {step === 6 && confirmation && <section className="confirmation-panel" aria-live="polite"><div className="confirmation-tick"><Check /></div><span className="eyebrow">Booked</span><h2>You have a time.</h2><p>A confirmation has been prepared for {confirmation.email || confirmation.phone}.</p><dl><div><dt>Date</dt><dd>{format(new Date(confirmation.startAt), "EEEE d MMMM yyyy")}</dd></div><div><dt>Time</dt><dd>{format(new Date(confirmation.startAt), "h:mm a")} · Australia/Melbourne</dd></div><div><dt>Worker</dt><dd>{workers.find((worker) => worker.id === confirmation.workerId)?.firstName}</dd></div><div><dt>Format</dt><dd>{formatLabels[confirmation.format]}</dd></div></dl>{confirmation.format === "video" && <p className="inline-note"><Video /> Your private video link will be sent before the appointment.</p>}<div className="confirmation-actions"><button className="button button-black" onClick={downloadCalendar}><CalendarDays /> Add to calendar</button><button className="button button-light" onClick={() => router.push("/account/appointments")}>Manage appointment</button></div><div className="demo-email"><span>Demo email preview</span><strong>Your first_step appointment is booked</strong><p>Hi {confirmation.participantName}, your conversation is booked for {format(new Date(confirmation.startAt), "EEEE d MMMM 'at' h:mm a")}. If this is no longer safe or suitable, use your management link to cancel or change it.</p></div><UrgentSupportBanner /></section>}
    </div>
  );
}

function FlowButtons({ step, next, back, submit = false }: { step: number; next: () => void; back?: () => void; submit?: boolean }) {
  return <div className="flow-actions">{back && <button type="button" className="button button-light" onClick={back}><ChevronLeft /> Back</button>}<button type={submit ? "submit" : "button"} className="button button-black" onClick={submit ? undefined : next}>{submit ? "Book this appointment" : step === 4 ? "Use this time" : "Continue"} <ArrowRight /></button></div>;
}

export function ResourceFilters({ category, setCategory, formatFilter, setFormatFilter, search, setSearch, noReferral, setNoReferral, clearFilters }: { category: string; setCategory: (value: string) => void; formatFilter: string; setFormatFilter: (value: string) => void; search: string; setSearch: (value: string) => void; noReferral: boolean; setNoReferral: (value: boolean) => void; clearFilters: () => void }) {
  const categories = ["All topics", ...Array.from(new Set(resources.map((resource) => resource.category)))];
  const active = Boolean(search || category !== "All topics" || formatFilter !== "Any format" || noReferral);
  return <aside className="resource-filters" aria-label="Resource filters"><div className="search-box"><Search /><label><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by service or need" /></label></div><details className="filter-disclosure" open><summary><SlidersHorizontal /> Topic and format filters</summary><div className="filter-row"><label><span>Topic</span><span className="select-wrap"><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown aria-hidden="true" /></span></label><label><span>Format</span><span className="select-wrap"><select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}><option>Any format</option><option>online</option><option>phone</option><option>in-person</option></select><ChevronDown aria-hidden="true" /></span></label><label className="checkbox-filter"><input type="checkbox" checked={noReferral} onChange={(event) => setNoReferral(event.target.checked)} /> No referral required</label>{active && <button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button>}</div></details></aside>;
}

function ResourcesPage({ state }: { state: DemoState }) {
  const [category, setCategory] = useState("All topics");
  const [formatFilter, setFormatFilter] = useState("Any format");
  const [search, setSearch] = useState("");
  const [noReferral, setNoReferral] = useState(false);
  const filtered = resources.filter((resource) => resource.status !== "archived" && (category === "All topics" || resource.category === category) && (formatFilter === "Any format" || resource.formats.includes(formatFilter as "online")) && (!noReferral || resource.noReferral) && `${resource.title} ${resource.summary} ${resource.category}`.toLowerCase().includes(search.toLowerCase()));
  const clearFilters = () => { setCategory("All topics"); setFormatFilter("Any format"); setSearch(""); setNoReferral(false); };
  return <div className="task-page wide"><PageIntro eyebrow="Useful now" title="Know what happens next." copy="Not a dead directory. Every option explains the cost, contact, hours and what you may need." /><div className="source-key"><span><SourceBadge resource={resources[0]} /> Current external information</span><span><SourceBadge resource={resources[4]} /> Seeded pilot pathway</span><span><SourceBadge resource={resources[5]} /> Illustrative future service</span></div><ResourceFilters category={category} setCategory={setCategory} formatFilter={formatFilter} setFormatFilter={setFormatFilter} search={search} setSearch={setSearch} noReferral={noReferral} setNoReferral={setNoReferral} clearFilters={clearFilters} /><p className="results-count" aria-live="polite">Showing {filtered.length} useful option{filtered.length === 1 ? "" : "s"}</p><div className="resource-grid">{filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} saved={state.savedResources.includes(resource.slug)} onSave={() => demoRepository.saveResource(resource.slug)} />)}</div>{!filtered.length && <EmptyState title="Nothing matches those filters.">Try a broader search or clear every filter.<br /><button type="button" className="button button-light" onClick={clearFilters}>Clear filters</button></EmptyState>}</div>;
}

function ResourceDetail({ slug, state }: { slug: string; state: DemoState }) {
  const resource = resources.find((item) => item.slug === slug);
  if (!resource) return <NotFound />;
  return <div className="task-page resource-detail"><a className="back-button" href="/resources"><ChevronLeft /> All useful options</a><SourceBadge resource={resource} /><h1>{resource.title}</h1><p className="lead">{resource.summary}</p><div className="detail-layout"><article><h2>What it helps with</h2><p>{resource.description}</p><h2>What happens next</h2><p>{resource.nextStep}</p><h2>What you may need</h2><p>{resource.noReferral ? "No first_step referral is required. The external service may ask only for details needed to respond." : "A worker can check fit first. Nothing is shared with a partner until you consent."}</p>{resource.sourceType !== "verified_external" && <div className="demo-content-warning"><AlertTriangle /><p><strong>This is demonstration pilot content.</strong> Confirm current details with a qualified worker or the relevant provider before relying on it.</p></div>}</article><aside className="detail-facts"><dl><div><dt>Cost</dt><dd>{resource.cost}</dd></div><div><dt>Contact</dt><dd>{resource.contact}</dd></div><div><dt>Formats</dt><dd>{resource.formats.join(", ")}</dd></div><div><dt>Age</dt><dd>{resource.age}</dd></div><div><dt>Location</dt><dd>{resource.location}</dd></div><div><dt>Hours</dt><dd>{resource.openingHours}</dd></div><div><dt>Last checked</dt><dd>{format(new Date(`${resource.lastVerifiedAt}T12:00:00`), "d MMMM yyyy")}</dd></div></dl>{resource.phone && <a className="button button-red" href={`tel:${resource.phone}`}><Phone /> Call {resource.phone}</a>}{resource.website && <a className="button button-black" href={resource.website} target="_blank" rel="noreferrer">Official website <ExternalLink /></a>}<button className="button button-light" onClick={() => demoRepository.saveResource(resource.slug)}><Bookmark /> {state.savedResources.includes(resource.slug) ? "Saved" : "Save for later"}</button></aside></div><MascotPrompt><strong>Want help checking fit?</strong><p>A worker can talk through the option without making a referral.</p><a href="/book">Talk to someone</a></MascotPrompt></div>;
}

const pathwayCopy: Record<string, { title: string; copy: string; icon: ReactNode; category: string }> = {
  talk: { title: "Talk to a real person.", copy: "Choose phone, video, scheduled text or an in-person conversation. No life story required.", icon: <MessageCircle />, category: "Talk to someone" },
  work: { title: "Make work the next practical step.", copy: "Find résumé help, interview practice and properly paid opportunities. Productive work is paid work.", icon: <BriefcaseBusiness />, category: "Work and paid opportunities" },
  study: { title: "Find a study or training path.", copy: "Compare TAFE, VCE VM and practical training without committing today.", icon: <GraduationCap />, category: "Study and training" },
  money: { title: "Sort one money pressure first.", copy: "Start with a bill, concession, debt question or financial counselling pathway.", icon: <Banknote />, category: "Money and financial stability" },
  "food-transport": { title: "Find food or transport help.", copy: "See local options and what you may need before you go.", icon: <TrainFront />, category: "Food and transport" },
};

function PathwayPage({ type }: { type: string }) {
  if (type === "safe-tonight") return <SafeTonight />;
  const data = pathwayCopy[type] ?? pathwayCopy.talk;
  const matched = resources.filter((resource) => resource.category === data.category || (type === "talk" && resource.urgency === "urgent")).slice(0, 3);
  return <div className="task-page"><PageIntro eyebrow="A practical pathway" title={data.title} copy={data.copy}><span className="intro-icon">{data.icon}</span></PageIntro><div className="next-step-box"><span>Strongest next step</span><h2>{type === "talk" ? "Book a 30-minute youth-worker conversation" : matched[0]?.title}</h2><p>{type === "talk" ? "Bring one question. Or say you are not sure yet." : matched[0]?.summary}</p><a className="button button-mint" href={type === "talk" ? "/book" : `/resources/${matched[0]?.slug}`}>Take this step <ArrowRight /></a></div><h2 className="subheading">Other useful options</h2><div className="resource-grid">{matched.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div><MascotPrompt><strong>Not ready to talk?</strong><p>Browse first. Come back when it feels useful.</p><a href="/resources">Browse all options</a></MascotPrompt></div>;
}

function SafeTonight() {
  return <div className="task-page"><PageIntro eyebrow="Urgent housing and safety" title="Need somewhere safe tonight?" copy="Skip the questions. These external services are available now. first_step appointments are not emergency support." /><UrgentSupportBanner full /><div className="urgent-calls"><a href="tel:000"><strong>Immediate danger</strong><span>Call 000</span><Phone /></a><a href="tel:1800825955"><strong>Victoria homelessness support</strong><span>1800 825 955 · 24 hours</span><Phone /></a><a href="tel:1800551800"><strong>Kids Helpline · ages 5–25</strong><span>1800 55 1800 · 24/7</span><Phone /></a><a href="tel:1800737732"><strong>1800RESPECT</strong><span>1800 737 732 · text 0458 737 732</span><Phone /></a><a href="tel:131114"><strong>Lifeline</strong><span>13 11 14 · 24/7</span><Phone /></a></div><div className="boundary-box"><ShieldCheck /><div><h2>These services are external.</h2><p>first_step does not operate them. We list them because they may help sooner than a scheduled appointment.</p></div></div><div className="flow-actions"><a className="button button-light" href="/resources">Continue browsing</a><a className="button button-black" href="/book">Talk to someone</a></div></div>;
}

function StaticPage({ type }: { type: string }) {
  const pages: Record<string, { eyebrow: string; title: string; copy: string; content: ReactNode }> = {
    about: { eyebrow: "About first_step", title: "Build the bridge. Back the person.", copy: "first_step makes the first step easier for young people facing housing instability, homelessness risk or barriers to financial stability.", content: <div className="about-composition"><div><h2>We sit earlier.</h2><p>We are not trying to replace housing services, TAFE, social enterprises or youth workers. We build a bridge that helps young people reach them.</p><div className="principle-list">{["Dignity without disclosure", "All work is paid work", "Practicality over performance", "Partnership over ego", "Small enough to test"].map((item, index) => <div key={item}><span>0{index + 1}</span><h3>{item}</h3></div>)}</div></div><aside className="about-boundaries"><img src="/brand/first_step_mascot.svg" alt="" /><div className="about-do-dont"><section><h2>What we do</h2><ul><li><Check /> Make the first step easier</li><li><Check /> Connect young people to qualified workers</li><li><Check /> Explain what happens next</li><li><Check /> Support consent-led warm referrals</li></ul></section><section><h2>What we do not do</h2><ul><li><X /> Provide emergency accommodation</li><li><X /> Replace specialist services</li><li><X /> Demand a full personal history</li><li><X /> Share participant information with sponsors</li></ul></section></div><div className="clear-boundary-callout"><ShieldCheck /><div><h2>Clear operating boundaries</h2><p>first_step is not emergency support, clinical care, legal advice, financial advice or housing provision. Qualified people and established organisations deliver those services.</p></div></div></aside></div> },
    privacy: { eyebrow: "Plain-language privacy", title: "Collect less. Explain it clearly.", copy: "This is pilot policy copy for review, not final legal advice.", content: <><h2>What we collect</h2><p>For a booking: the name you use, age band, broad topics, safe contact details, accessibility needs you choose to share and the appointment time.</p><h2>Who can see it</h2><p>Your assigned worker and authorised pilot administrators. A referral partner sees only fields you approve. Sponsors never see participant-level data.</p><h2>What we do not use</h2><p>No advertising pixels, behavioural advertising, session replay or unrestricted sensitive notes.</p><h2>Your choices</h2><p>You can ask for your data, correct it, withdraw referral consent or request account deletion. Production retention periods require legal, privacy and safeguarding review.</p><a className="button button-black" href="/account">Open account choices</a></> },
    consent: { eyebrow: "Consent, plainly", title: "Nothing about you, without you.", copy: "Booking consent and referral consent are separate choices.", content: <><h2>Booking consent</h2><p>You agree to first_step using the minimum details needed to arrange and run a conversation.</p><h2>Referral consent</h2><p>Before a warm referral, you see the partner, what they do, every field proposed for sharing and what may happen next. You can say no.</p><h2>Withdraw consent</h2><p>Tell your worker or use the account request. Withdrawal cannot undo information already lawfully sent, but it stops future sharing where possible.</p></> },
    terms: { eyebrow: "Service status and terms", title: "A pilot, described honestly.", copy: "first_step is a demonstration pilot platform. It is not yet a commissioned live youth-work service.", content: <><h2>Use of this demonstration</h2><p>Sample bookings and dashboards are stored on this device. Do not enter real sensitive information.</p><h2>Information limits</h2><p>External crisis details are separated from demonstration partner and pathway content. Check current details with the relevant service.</p><h2>No emergency monitoring</h2><p>first_step messages and appointments are not monitored continuously. Call 000 in immediate danger.</p></> },
    safety: { eyebrow: "Safety and urgent help", title: "Know the boundary. Get faster help.", copy: "first_step appointments are scheduled. They are not emergency or 24-hour crisis support.", content: <><SafeTonight /></> },
  };
  const page = pages[type] ?? pages.about;
  return <div className="task-page static-page"><PageIntro eyebrow={page.eyebrow} title={page.title} copy={page.copy} /><article className={`prose ${type === "about" ? "about-prose" : ""}`}>{page.content}</article></div>;
}

export function SponsorBoundaryNotice() {
  return <aside className="sponsor-boundary"><ShieldCheck /><div><h3>Funding never buys access to a person.</h3><p>Sponsors receive aggregated pilot measures only. No identities, appointments, referrals, messages or influence over worker recommendations.</p></div></aside>;
}

function PartnersPage() {
  return <div className="task-page wide"><PageIntro eyebrow="Partnership over ego" title="Coordinate the roads between good services." copy="first_step helps young people reach qualified workers, education, paid-work pathways and specialist support." /><div className="operating-model"><article><UsersRound /><h2>Youth workers</h2><p>Manage safe engagement, practical conversations and consent-led connections.</p></article><article><GraduationCap /><h2>Education</h2><p>TAFE and VCE VM programs provide real learning pathways.</p></article><article><BriefcaseBusiness /><h2>Social enterprise</h2><p>Provide properly paid work or lawful, structured vocational placements.</p></article><article><HeartHandshake /><h2>Specialist services</h2><p>Provide housing, family violence, health and other qualified support.</p></article></div><section className="warm-referral-explain"><div><span className="eyebrow">A link is not a warm referral</span><h2>Ask. Explain. Consent. Connect.</h2><ol><li><span>1</span>Worker suggests a relevant partner.</li><li><span>2</span>The young person sees exactly what would be shared.</li><li><span>3</span>They consent or decline.</li><li><span>4</span>Only approved information is sent.</li></ol></div><img src="/images/fs_img_3.jpg" alt="People making a team gesture" /></section><SponsorBoundaryNotice /></div>;
}

export function ImpactMetric({ value, label }: { value: string; label: string }) { return <div className="impact-metric"><strong>{value}</strong><span>{label}</span></div>; }

function ImpactPage({ admin = false }: { admin?: boolean }) {
  const metrics = admin ? [["68%", "Pathway completion"], ["42%", "Appointment conversion"], ["76%", "Appointment attendance"], ["61%", "Referral acceptance"], ["Work + study", "Top selected topics"], ["Choose time", "Common drop-off"], ["$84", "Cost per successful referral · manual demo input"], ["74%", "Sponsor renewal interest · demo only"]] : [["68%", "Pathways completed"], ["42%", "Booking conversion"], ["76%", "Appointments attended"], ["61%", "Referrals accepted"]];
  return <div className="task-page wide"><PageIntro eyebrow="Demonstration pilot data" title={admin ? "Pilot activity, without private stories." : "Measure whether the bridge works."} copy="Every figure below is seeded demonstration data. It does not claim proven impact." /><div className="impact-grid">{metrics.map(([value, label]) => <ImpactMetric key={label} value={value} label={label} />)}</div><div className="impact-method"><article><h2>What we measure</h2><p>Completed pathways, bookings, attendance, referrals offered and accepted, second-step completion and broad feedback.</p></article><article><h2>What we do not claim</h2><p>That first_step solves homelessness, caused a life outcome or operates at national scale.</p></article><article><h2>How privacy is protected</h2><p>Public and sponsor views contain aggregate measures only. No names, contact details, messages or participant timelines.</p></article></div><SponsorBoundaryNotice /></div>;
}

function ReportDemoLabel({ compact = false }: { compact?: boolean }) {
  return <p className={`report-demo-label ${compact ? "compact" : ""}`}><strong>Demonstration pilot data</strong>{!compact && <span>This screen shows how first_step could report a small sponsor-funded pilot. The figures below are sample data, not real participant outcomes.</span>}</p>;
}

function ReportMetricCard({ metric }: { metric: typeof demonstrationReport.coreMetrics[number] }) {
  const value = metric.id === "confidence" ? `+${metric.value}` : metric.value.toLocaleString("en-AU");
  return <article className="report-metric-card"><strong>{value}</strong><h3>{metric.label}</h3><p>{metric.note}</p><span>{metric.status}</span></article>;
}

function ParticipantFunnel() {
  const stages = demonstrationReport.funnel;
  return <section className="report-section report-funnel-section" aria-labelledby="funnel-heading"><ReportDemoLabel compact /><div className="report-section-heading"><div><span className="eyebrow">Participant funnel</span><h2 id="funnel-heading">The next step became narrower at each stage.</h2></div><p>Counts show an opt-in journey, not a sales conversion target.</p></div><div className="funnel-list">{stages.map((stage, index) => { const previous = stages[index - 1]?.value ?? stage.value; const width = Math.max(18, Math.round((stage.value / stages[0].value) * 100)); return <article key={stage.id} className={index === 1 || index === 4 ? "funnel-dropoff" : ""}><div className="funnel-label"><span>{index + 1}</span><strong>{stage.label}</strong></div><div className="funnel-bar-wrap"><div className="funnel-bar" style={{ width: `${width}%` }}><strong>{stage.value.toLocaleString("en-AU")}</strong></div></div><small>{index ? `${reportPercent(stage.value, previous)}% from the previous step` : "Starting point"}</small></article>; })}</div><div className="funnel-annotation"><AlertTriangle /><p><strong>The two largest drop-offs are visible, not hidden.</strong> Most visitors browsed without beginning a guided pathway. That is not automatically failure: many users may only need information. The next pilot should distinguish useful browsing from frustrated drop-off. A second gap appears between completed pathways and appointment booking.</p></div></section>;
}

function ImpactDashboardPage() {
  const report = demonstrationReport;
  const { metrics } = report;
  const appointmentAttendance = reportPercent(metrics.appointmentsCompleted, metrics.appointmentsBooked);
  const referralConsent = reportPercent(metrics.referralsConsented, metrics.referralsOffered);
  const partnerAcceptance = reportPercent(metrics.referralsAccepted, metrics.referralsConsented);
  const pathwayCompletion = reportPercent(metrics.guidedPathwaysCompleted, metrics.guidedPathwaysStarted);
  const costPerBoothInteraction = Math.round(metrics.pilotBudget / metrics.boothInteractions);
  const costPerAppointment = Math.round(metrics.pilotBudget / metrics.appointmentsCompleted);
  const costPerReferral = Math.round(metrics.pilotBudget / metrics.referralsAccepted);
  const costPerPlacement = Math.round(metrics.pilotBudget / metrics.placementsBegan);
  return <div className="impact-dashboard"><section className="report-header"><div><span className="eyebrow light">{report.pilot.name} · Demonstration report</span><h1>Measure the bridge.<br /><em>Protect the person.</em></h1><p>{report.pilot.period}. One public activation, an online channel that stayed open, and consent-led next steps.</p></div><aside><label><span>Reporting period</span><select aria-label="Reporting period" defaultValue="pilot-001"><option value="pilot-001">Pilot 001 · Eight weeks</option></select></label><dl><div><dt>Public activation</dt><dd>One TAFE-campus pop-up</dd></div><div><dt>Online channel</dt><dd>Active throughout</dd></div></dl></aside></section><div className="report-content"><ReportDemoLabel /><section className="report-executive report-section"><div><span className="eyebrow">Executive summary</span><h2>Did the bridge work?</h2><p>The demonstration suggests that first_step can turn low-pressure public and online contact into real conversations, referrals and paid opportunities. The strongest result is not reach alone. It is the number of people who chose a second step.</p></div><div className="summary-findings"><article><UsersRound /><h3>People used both doors</h3><p>The public pop-up generated visibility. The online channel gave people a quieter way to return later.</p></article><article><MessageCircle /><h3>Human support mattered</h3><p>Participants who booked a youth-worker conversation were more likely to complete a pathway or accept a referral.</p></article><article><CircleHelp /><h3>The bridge still loses people</h3><p>A meaningful number of users began a pathway but did not complete it. The next pilot should test shorter flows and stronger follow-up choices.</p></article></div></section><section className="report-section" aria-labelledby="core-metrics-heading"><ReportDemoLabel compact /><div className="report-section-heading"><div><span className="eyebrow">Core outcomes</span><h2 id="core-metrics-heading">Count the practical next step.</h2></div><p>There is one reporting period only. No year-on-year comparison is implied.</p></div><div className="report-metric-grid">{report.coreMetrics.map((metric) => <ReportMetricCard key={metric.id} metric={metric} />)}</div><p className="calculation-note">{pathwayCompletion}% completed a guided pathway; {appointmentAttendance}% of booked appointments were attended; {referralConsent}% of offered referrals were consented to; and {partnerAcceptance}% of consented referrals were accepted by a partner.</p></section><ParticipantFunnel /><section className="report-section channel-section"><ReportDemoLabel compact /><div className="report-section-heading"><div><span className="eyebrow">Entry channels</span><h2>Two doors, one connected service.</h2></div><p>The pop-up created trust and awareness. Online access extended the life of the activation. Accepted referrals were evenly split across both doors.</p></div><div className="channel-comparison">{report.channels.map((channel) => <article key={channel.name}><h3>{channel.name}</h3><p>{channel.note}</p><dl><div><dt>{channel.interactions ? "Booth interactions" : "Platform visits"}</dt><dd>{(channel.interactions || channel.visits).toLocaleString("en-AU")}</dd></div><div><dt>Attributed platform visits</dt><dd>{channel.visits.toLocaleString("en-AU")}</dd></div><div><dt>Sign-ups</dt><dd>{channel.signUps}</dd></div><div><dt>Appointments booked</dt><dd>{channel.appointments}</dd></div><div><dt>Accepted referrals</dt><dd>{channel.acceptedReferrals}</dd></div></dl></article>)}</div><div className="report-table-wrap"><table><caption>Entry-channel totals in this demonstration report</caption><thead><tr><th>Channel</th><th>Visits</th><th>Sign-ups</th><th>Booked</th><th>Accepted referrals</th></tr></thead><tbody>{report.channels.map((channel) => <tr key={channel.name}><th scope="row">{channel.name}</th><td>{channel.visits}</td><td>{channel.signUps}</td><td>{channel.appointments}</td><td>{channel.acceptedReferrals}</td></tr>)}</tbody></table></div></section><section className="report-section referral-section"><ReportDemoLabel compact /><div className="report-section-heading"><div><span className="eyebrow">Referral outcomes</span><h2>A link is not a warm referral.</h2></div><p>“Accepted” means the partner accepted or began the referral process. It does not mean a participant’s underlying issue was resolved.</p></div><div className="referral-sequence">{[["Offered", report.referrals.offered], ["Participant consents", report.referrals.consented], ["Sent", report.referrals.sent], ["Accepted by partners", report.referrals.accepted]].map(([label, value]) => <article key={label as string}><strong>{value}</strong><span>{label}</span><ArrowRight /></article>)}</div><div className="referral-layout"><div><h3>Accepted referral categories</h3><ul className="category-bars">{report.referrals.categories.map(([label, value]) => <li key={label}><span>{label}</span><i style={{ width: `${(value / report.referrals.accepted) * 100}%` }}><b>{value}</b></i></li>)}</ul></div><aside><h3>Other referral outcomes</h3><dl><div><dt>Awaiting partner response</dt><dd>{report.referrals.awaiting}</dd></div><div><dt>Participant declined</dt><dd>{report.referrals.declined}</dd></div><div><dt>Not sent after reconsidering</dt><dd>{report.referrals.reconsidered}</dd></div></dl></aside></div></section><section className="report-section report-two-column"><article className="confidence-card"><ReportDemoLabel compact /><span className="eyebrow">Confidence and readiness</span><h2>Confidence to take the next step</h2><p>Participant self-rating only. It is not a clinical measure.</p><div className="rating-steps"><div><strong>{report.confidence.before}</strong><span>Average starting self-rating</span></div><ArrowRight /><div><strong>{report.confidence.after}</strong><span>Average follow-up self-rating</span></div></div><p className="calculation-note">+{(report.confidence.after - report.confidence.before).toFixed(1)} points across {report.confidence.responses} people who completed both ratings. The sample is too small for broad claims.</p></article><article className="placement-card"><span className="eyebrow">Paid opportunities</span><h2>Work counts only when it is paid or formally structured.</h2><div className="placement-stats"><div><strong>{report.placements.created}</strong><span>Paid placement opportunities created</span></div><div><strong>{report.placements.began}</strong><span>Participants began a paid placement</span></div><div><strong>{report.placements.anotherPathway}</strong><span>Chose another pathway</span></div><div><strong>{report.placements.unmatched}</strong><span>Opportunity unmatched at period end</span></div></div><p className="boundary-note"><BriefcaseBusiness /> first_step counts an opportunity only when a paid role or formally structured lawful placement exists. General expressions of interest are not counted.</p></article></section><section className="report-section feedback-section"><ReportDemoLabel compact /><div className="report-section-heading"><div><span className="eyebrow">Participant feedback</span><h2>Sample feedback, not borrowed stories.</h2></div><p>Sample participant feedback written for this demonstration. No names, ages, suburbs or identifying details are included.</p></div><div className="quote-grid">{report.participantFeedback.quotes.map((quote, index) => <blockquote key={quote}><span>0{index + 1}</span><p>“{quote}”</p></blockquote>)}</div><div className="feedback-stat-grid"><div><strong>{report.participantFeedback.rating} / 5</strong><span>Experience rating</span></div><div><strong>{report.participantFeedback.respected}%</strong><span>Felt respected</span></div><div><strong>{report.participantFeedback.understoodNextStep}%</strong><span>Understood the next step</span></div><div><strong>{report.participantFeedback.wouldReturn}%</strong><span>Would return if needed</span></div></div><p className="calculation-note">Based on {report.participantFeedback.responses} demonstration responses.</p></section><section className="report-section stakeholder-section"><ReportDemoLabel compact /><div className="report-section-heading"><div><span className="eyebrow">Partner and sponsor feedback</span><h2>Useful scrutiny is part of the pilot.</h2></div><p>No sponsor logos, endorsements or real organisation claims are shown in this demonstration.</p></div><div className="stakeholder-grid"><article><HeartHandshake /><h3>Partner feedback</h3><dl><div><dt>Partner satisfaction</dt><dd>{report.stakeholderFeedback.partners.rating} / 5</dd></div><div><dt>Enough referral information</dt><dd>{report.stakeholderFeedback.partners.enoughInformation}%</dd></div><div><dt>Referral boundaries clear</dt><dd>{report.stakeholderFeedback.partners.boundariesClear}%</dd></div><div><dt>Interested in another pilot</dt><dd>{report.stakeholderFeedback.partners.repeatPilot}</dd></div></dl></article><article><Banknote /><h3>Sponsor feedback</h3><dl><div><dt>Renewal interest</dt><dd>{report.stakeholderFeedback.sponsors.renewalInterest}%</dd></div><div><dt>Reporting credible and cautious</dt><dd>{report.stakeholderFeedback.sponsors.credibleReporting}%</dd></div><div><dt>Useful staff-engagement value</dt><dd>{report.stakeholderFeedback.sponsors.staffEngagement}%</dd></div><div><dt>Wanted longer-term reporting</dt><dd>{report.stakeholderFeedback.sponsors.wantedLongerTermReporting}%</dd></div></dl></article></div></section><section className="report-section cost-section"><ReportDemoLabel compact /><div><span className="eyebrow">Cost and value</span><h2>Put the whole pilot cost beside the selected outcomes.</h2><p>These figures divide the full pilot cost by selected outcomes. They are not direct unit costs and should not be read in isolation.</p></div><div className="cost-grid"><div><strong>{reportCurrency(metrics.pilotBudget)}</strong><span>Demonstration pilot cost</span></div><div><strong>{reportCurrency(costPerBoothInteraction)}</strong><span>Cost per booth interaction</span></div><div><strong>{reportCurrency(costPerAppointment)}</strong><span>Cost per completed appointment</span></div><div><strong>{reportCurrency(costPerReferral)}</strong><span>Cost per accepted referral</span></div><div><strong>{reportCurrency(costPerPlacement)}</strong><span>Cost per participant beginning a paid placement</span></div></div><p className="calculation-note">The pilot budget also funds youth-worker availability, food and transport support, platform access, safeguarding, booth delivery, referral coordination and evaluation. Referrals and placements were not purchased.</p></section><section className="report-section learnings-section"><div className="report-section-heading"><div><span className="eyebrow">What the pilot learned</span><h2>Keep the useful parts. Test the rest.</h2></div></div><div className="learning-grid">{report.learnings.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section><section className="report-section limitations-section"><AlertTriangle /><div><span className="eyebrow">Credibility boundary</span><h2>What this pilot cannot tell us yet</h2><p>These omissions are not a weakness in the report. They are the questions a careful next pilot must answer.</p><ul>{report.limitations.map((item) => <li key={item}><Check /> {item}</li>)}</ul></div></section><section className="privacy-report-boundary"><ShieldCheck /><div><span className="eyebrow">Privacy and sponsor boundaries</span><h2>Measure the bridge. Protect the person.</h2><p><strong>Sponsor funding does not purchase access to participant data.</strong></p><div className="boundary-columns"><section><h3>Sponsors and public partners may see</h3><ul>{["Aggregate engagement totals", "Grouped pathway interests", "Conversion rates", "Anonymised feedback", "Overall referral outcomes", "Broad financial reporting"].map((item) => <li key={item}><Check /> {item}</li>)}</ul></section><section><h3>They do not see</h3><ul>{["Names", "Contact details", "Appointment messages", "Individual referral records", "Personal histories", "Worker notes", "Identifiable journeys", "Participant-level dashboards"].map((item) => <li key={item}><X /> {item}</li>)}</ul></section></div></div></section><section className="report-section recommendations-section"><div><span className="eyebrow">Next-pilot recommendations</span><h2>Scale only what proves useful, safe and worth returning to.</h2></div><ol>{report.recommendations.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></section></div></div>;
}

function MerchPage() {
  const [email, setEmail] = useState(""); const [size, setSize] = useState("M"); const [interest, setInterest] = useState("Black heavyweight tee"); const [joined, setJoined] = useState(false);
  const submit = (event: FormEvent) => { event.preventDefault(); if (/^\S+@\S+\.\S+$/.test(email)) { demoRepository.joinMerchWaitlist(email); setJoined(true); } };
  const products = [
    { name: "Black heavyweight tee", price: "$55 indicative", image: "/brand/MerchMocks/black-tee.png", alt: "Front and back view of the black first_step heavyweight t-shirt", note: "Heavy cotton · relaxed fit", sizes: "XS–2XL" },
    { name: "Cream heavyweight tee", price: "$55 indicative", image: "/brand/MerchMocks/white-tee.png", alt: "Front and back view of the cream first_step heavyweight t-shirt", note: "Heavy cotton · relaxed fit", sizes: "XS–2XL" },
    { name: "Community rally jacket", price: "$145 indicative", image: "/brand/MerchMocks/jacket.png", alt: "Front and back view of the black, cream, mint and red first_step community rally jacket", note: "Limited pilot piece · sponsor patches shown as mock-ups", sizes: "S–2XL", featured: true },
    { name: "Mascot beanie", price: "$38 indicative", image: "/brand/MerchMocks/beanie.png", alt: "Black rib-knit first_step beanie with mascot patch", note: "Rib knit · fold-up cuff", sizes: "One size" },
    { name: "Next-step socks", price: "$22 indicative", image: "/brand/MerchMocks/socks.png", alt: "White first_step socks with yellow toes, mint arrows and red mascots", note: "Cushioned crew sock", sizes: "S/M · L/XL" },
  ];
  return <div className="merch-page"><section className="merch-hero"><div><span className="eyebrow light">first_step · Drop 001</span><h1>Wear the<br /><em>first step.</em></h1><p>Five small-batch demonstration pieces designed to make the project visible and test a modest future trading stream. Support always comes first.</p><a className="button button-mint" href="#store">See the drop <ArrowRight /></a></div><div className="merch-hero-product"><img src="/brand/MerchMocks/black-tee.png" alt="Black first_step heavyweight t-shirt, shown front and back" /></div></section><section className="section merch-store" id="store"><div className="section-heading"><div><span className="eyebrow">The first drop</span><h2>Five useful things.<br />Zero checkout theatre.</h2></div><p>Indicative pricing helps test demand. Registering interest does not place an order or take payment.</p></div><div className="product-grid">{products.map((product, index) => <article key={product.name} className={product.featured ? "featured" : ""}><div className="product-art"><img src={product.image} alt={product.alt} /></div><div className="product-details"><span>0{index + 1} · Demonstration product</span><h3>{product.name}</h3><p>{product.note}</p><div className="product-meta"><strong>{product.price}</strong><span>{product.sizes}</span></div><a className="button button-light" href="#waitlist" onClick={() => setInterest(product.name)}>Register interest <ArrowRight /></a></div></article>)}</div></section><section className="waitlist-section" id="waitlist"><div><span className="eyebrow">No pretend checkout</span><h2>Tell us what you would wear.</h2><p>Joining records interest only. It does not place an order or take payment.</p><p className="selected-interest"><strong>Selected:</strong> {interest}</p></div>{joined ? <div className="success-box" role="status"><CheckCircle2 /><h3>You are on the demo list.</h3><p>No email was sent and no order was placed in demo mode.</p></div> : <form onSubmit={submit}><label><span>Item</span><select value={interest} onChange={(event) => setInterest(event.target.value)}>{products.map((product) => <option key={product.name}>{product.name}</option>)}</select></label><label><span>Size or interest</span><select value={size} onChange={(event) => setSize(event.target.value)}><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>2XL</option><option>Accessories only</option></select></label><label><span>Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></label><button className="button button-black">Join the drop list</button></form>}</section><SponsorBoundaryNotice /></div>;
}

function DemoPage({ state, hydrated }: { state: DemoState; hydrated: boolean }) {
  const roles: Array<{ id: Role; name: string; person: string; copy: string; href: string; icon: ReactNode }> = [
    { id: "participant", name: "Participant", person: "Jamie, 19", copy: "Wants help finding stable work and understanding TAFE options.", href: "/account", icon: <UserRound /> },
    { id: "youth_worker", name: "Youth worker", person: "Maya", copy: "Manages conversations, availability and consent-led referrals.", href: "/worker", icon: <MessageCircle /> },
    { id: "admin", name: "Administrator", person: "Pilot administrator", copy: "Manages workers, resources, settings and aggregate activity.", href: "/admin", icon: <SlidersHorizontal /> },
  ];
  return <div className="task-page"><PageIntro eyebrow="Demo mode" title="Try each side of the pilot." copy="This control exists only in demo mode. Production roles come from authenticated Supabase profiles." /><div className="demo-role-grid" data-hydrated={hydrated}>{roles.map((role) => <button disabled={!hydrated} className={state.role === role.id ? "selected" : ""} onClick={() => { demoRepository.setRole(role.id); window.location.assign(role.href); }} key={role.id}>{role.icon}<span>{role.name}</span><h2>{role.person}</h2><p>{role.copy}</p><strong>{state.role === role.id ? "Current role" : "Switch and open"} <ArrowRight /></strong></button>)}</div><div className="demo-checklist"><h2>Suggested review</h2><ol><li>Complete a guided pathway on a mobile-sized screen.</li><li>Book a sample appointment as a guest.</li><li>Switch to Maya and confirm the booking.</li><li>Offer a warm referral, then consent as Jamie.</li><li>Check admin aggregate data never exposes participant details.</li></ol></div></div>;
}

function RoleGate({ required, state, children }: { required: Role; state: DemoState; children: ReactNode }) {
  if (state.role === required) return children;
  return <div className="task-page"><PageIntro eyebrow="Demo role" title={`Switch to the ${required.replace("_", " ")} view.`} copy="Production roles cannot be selected by users. Demo mode makes each seeded persona inspectable." /><a className="button button-black" href="/demo">Open demo role switcher</a></div>;
}

function ParticipantPage({ section, state }: { section: string; state: DemoState }) {
  if (section === "appointments") return <ParticipantAppointments state={state} />;
  if (section === "pathways") return <div className="dashboard-page"><DashboardNav role="participant" /><main><PageIntro eyebrow="Saved next steps" title="Come back when you need the next." copy="Saved on this device in demo mode." />{state.savedPathways.length ? <div className="saved-list">{state.savedPathways.map((item) => <article key={item}><Sparkles /><div><h3>Your saved first step</h3><p>{item.replace("-", " · ")}</p></div><a href="/start">Open</a></article>)}</div> : <EmptyState title="You have not saved anything yet.">Start with what would make today easier.<br /><a href="/start">Choose a first step</a></EmptyState>}</main></div>;
  if (section === "referrals") return <ParticipantReferrals state={state} />;
  return <div className="dashboard-page"><DashboardNav role="participant" /><main><div className="dashboard-welcome"><span className="eyebrow">Participant demo</span><h1>Hey Jamie. What feels useful?</h1><p>Your dashboard shows only your next steps, appointments and consent choices.</p></div><div className="dashboard-grid"><article className="dashboard-feature"><span>Next appointment</span>{state.appointments.filter((item) => !item.status.startsWith("cancelled")).length ? <AppointmentSummary appointment={state.appointments.find((item) => !item.status.startsWith("cancelled"))!} /> : <EmptyState title="No appointment booked.">Talk through one question with a youth worker.</EmptyState>}<a className="button button-black" href="/book">Talk to someone</a></article><article><span>Saved resources</span><strong>{state.savedResources.length}</strong><p>Useful options kept for later.</p><a href="/resources">Browse resources</a></article><article><span>Referrals</span><strong>{state.referrals.filter((item) => item.status === "offered").length}</strong><p>Waiting for your choice.</p><a href="/account/referrals">Review consent</a></article></div><section className="account-privacy"><ShieldCheck /><div><h2>Your information. Your choices.</h2><p>Request a copy, correct details or ask for deletion. In demo mode, clearing site data removes local records.</p><button className="button button-light" onClick={() => alert("Demo request recorded. No data was sent.")}>Request my data</button><button className="button button-light" onClick={() => alert("Demo deletion request recorded. No live account exists.")}>Request account deletion</button></div></section></main></div>;
}

function DashboardNav({ role }: { role: "participant" | "worker" | "admin" }) {
  const pathname = usePathname() || "/";
  const items = role === "participant" ? [["Overview", "/account"], ["Appointments", "/account/appointments"], ["Saved steps", "/account/pathways"], ["Referrals", "/account/referrals"]] : role === "worker" ? [["Today", "/worker"], ["Appointments", "/worker/appointments"], ["Availability", "/worker/availability"], ["Referrals", "/worker/referrals"]] : [["Pilot overview", "/admin"], ["Workers", "/admin/workers"], ["Resources", "/admin/resources"], ["Partners", "/admin/partners"], ["Locations", "/admin/locations"], ["Service settings", "/admin/service-settings"], ["Impact", "/admin/impact"]];
  return <aside className="dashboard-nav"><BrandLogo /><span>{role === "participant" ? "Jamie’s account" : role === "worker" ? "Worker space · Maya" : "Pilot administration"}</span><nav>{items.map(([label, href]) => <a key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}<ChevronRight /></a>)}</nav><a href="/demo" className="switch-role">Switch demo role</a></aside>;
}

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  return <div className="appointment-summary"><CalendarDays /><div><strong>{format(new Date(appointment.startAt), "EEEE d MMMM · h:mm a")}</strong><span>{formatLabels[appointment.format]} with {workers.find((worker) => worker.id === appointment.workerId)?.firstName}</span><small className={`status status-${appointment.status}`}>{appointment.status.replaceAll("_", " ")}</small></div></div>;
}

function ParticipantAppointments({ state }: { state: DemoState }) {
  const active = state.appointments.filter((item) => !item.status.startsWith("cancelled"));
  const previous = state.appointments.filter((item) => item.status.startsWith("cancelled") || item.status === "completed");
  const reschedule = (appointment: Appointment) => demoRepository.updateAppointment(appointment.id, { startAt: addDays(new Date(appointment.startAt), 7).toISOString(), endAt: addDays(new Date(appointment.endAt), 7).toISOString() });
  return <div className="dashboard-page"><DashboardNav role="participant" /><main><PageIntro eyebrow="Appointments" title="Your conversations." copy="Change or cancel without explaining why." /><h2>Upcoming</h2>{active.length ? <div className="appointment-list">{active.map((appointment) => <article key={appointment.id}><AppointmentSummary appointment={appointment} /><div><button className="button button-light" onClick={() => reschedule(appointment)}>Move one week later</button><button className="button button-danger-outline" onClick={() => demoRepository.updateAppointment(appointment.id, { status: "cancelled_participant" })}>Cancel</button></div></article>)}</div> : <EmptyState title="No upcoming appointments.">Book when talking feels useful.<br /><a href="/book">Find a time</a></EmptyState>}<h2>Previous</h2>{previous.length ? <div className="appointment-list">{previous.map((appointment) => <article key={appointment.id}><AppointmentSummary appointment={appointment} /></article>)}</div> : <p className="muted">No previous appointments in this demo.</p>}</main></div>;
}

export function ReferralConsentCard({ referral, onConsent, onDecline }: { referral: DemoState["referrals"][number]; onConsent: () => void; onDecline: () => void }) {
  return <article className="referral-card"><span className={`status status-${referral.status}`}>{referral.status.replaceAll("_", " ")}</span><h2>{referral.partnerName}</h2><p>{referral.partnerSummary}</p><h3>Information proposed for sharing</h3><ul>{referral.sharedFields.map((field) => <li key={field}><Check />{field}</li>)}</ul><h3>Participant-approved summary</h3><blockquote>{referral.approvedSummary}</blockquote>{referral.status === "offered" && <><p className="consent-note"><ShieldCheck /> Saying no does not affect your first_step appointment.</p><div className="flow-actions"><button className="button button-black" onClick={onConsent}>I consent to this referral</button><button className="button button-light" onClick={onDecline}>No, not now</button></div></>}</article>;
}

function ParticipantReferrals({ state }: { state: DemoState }) {
  return <div className="dashboard-page"><DashboardNav role="participant" /><main><PageIntro eyebrow="Warm referrals" title="See what would be shared." copy="A worker suggests. You decide." />{state.referrals.length ? <div className="referral-list">{state.referrals.map((referral) => <ReferralConsentCard key={referral.id} referral={referral} onConsent={() => demoRepository.updateReferral(referral.id, { status: "consented", consentedAt: new Date().toISOString() })} onDecline={() => demoRepository.updateReferral(referral.id, { status: "declined" })} />)}</div> : <EmptyState title="There are no referrals waiting.">A youth worker can talk through options with you first.</EmptyState>}</main></div>;
}

function WorkerPage({ section, state }: { section: string; state: DemoState }) {
  const [availability, setAvailability] = useState([true, true, true, true, false]);
  const [availabilitySaved, setAvailabilitySaved] = useState(false);
  if (section === "availability") return <div className="dashboard-page"><DashboardNav role="worker" /><main><PageIntro eyebrow="Worker availability" title="Set hours without calendar clutter." copy="Recurring hours, exceptions, formats, locations, notice and capacity." /><div className="availability-editor">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => <div key={day}><label><input type="checkbox" checked={availability[index]} onChange={(event) => { setAvailabilitySaved(false); setAvailability(availability.map((item, itemIndex) => itemIndex === index ? event.target.checked : item)); }} /><strong>{day}</strong></label>{availability[index] ? <><input aria-label={`${day} start time`} type="time" defaultValue={index % 2 ? "12:00" : "10:00"} /><span>to</span><input aria-label={`${day} end time`} type="time" defaultValue={index % 2 ? "18:00" : "16:00"} /><select aria-label={`${day} appointment format`} defaultValue="all"><option value="all">All enabled formats</option><option>Phone</option><option>Video</option><option>Text</option><option>In person</option></select></> : <span>Unavailable</span>}</div>)}</div><div className="settings-grid"><label><span>Minimum booking notice</span><select defaultValue="12"><option value="4">4 hours</option><option value="12">12 hours</option><option value="24">24 hours</option></select></label><label><span>Booking window</span><select defaultValue="21"><option value="14">14 days</option><option value="21">21 days</option><option value="28">28 days</option></select></label><label><span>Daily capacity</span><input type="number" min="1" max="8" defaultValue="5" /></label></div><h2>Exceptions</h2><div className="exception-row"><CalendarDays /><div><strong>Friday 14 August</strong><span>Unavailable · leave</span></div><button className="button button-light">Edit</button></div><button className="button button-black" onClick={() => setAvailabilitySaved(true)}>Save availability</button>{availabilitySaved && <p className="save-confirmation" role="status"><CheckCircle2 /> Availability saved in demo mode.</p>}</main></div>;
  if (section === "referrals") return <div className="dashboard-page"><DashboardNav role="worker" /><main><PageIntro eyebrow="Warm referrals" title="Move only with consent." copy="Track offered, consented, sent and accepted referrals." /><div className="table-wrap"><table><thead><tr><th>Participant</th><th>Partner</th><th>Status</th><th>Updated</th></tr></thead><tbody>{state.referrals.map((referral) => <tr key={referral.id}><td>Jamie</td><td>{referral.partnerName}</td><td><span className={`status status-${referral.status}`}>{referral.status.replaceAll("_", " ")}</span></td><td>Today</td></tr>)}</tbody></table></div></main></div>;
  const appointments = state.appointments;
  return <div className="dashboard-page"><DashboardNav role="worker" /><main><div className="dashboard-welcome"><span className="eyebrow">Tuesday · Worker demo</span><h1>Good morning, Maya.</h1><p>Keep records broad. This is not a clinical case-management system.</p></div><div className="worker-stats"><ImpactMetric value={`${appointments.length}`} label="Upcoming conversations" /><ImpactMetric value="2" label="Follow-ups requested" /><ImpactMetric value={`${state.referrals.filter((item) => item.status === "offered").length}`} label="Consent choices waiting" /></div><h2>Appointment queue</h2>{appointments.length ? <div className="appointment-list">{appointments.map((appointment) => <article key={appointment.id}><AppointmentSummary appointment={appointment} /><div><button className="button button-black" onClick={() => demoRepository.updateAppointment(appointment.id, { status: "confirmed" })}>Confirm</button><button className="button button-light" onClick={() => demoRepository.updateAppointment(appointment.id, { status: "completed" })}>Mark completed</button></div></article>)}</div> : <EmptyState title="No appointments yet.">Book one as the participant, then return to this view.</EmptyState>}<section className="outcome-options"><h2>Allowed outcome data</h2><div>{["Conversation completed", "Information provided", "Follow-up requested", "Warm referral offered", "Participant declined referral", "No further action requested"].map((item) => <span key={item}>{item}</span>)}</div><p>No diagnoses, trauma histories or extensive case notes.</p></section></main></div>;
}

function AdminPage({ section, state }: { section: string; state: DemoState }) {
  if (section === "impact") return <div className="dashboard-page"><DashboardNav role="admin" /><main><ImpactPage admin /></main></div>;
  if (section === "resources") return <div className="dashboard-page"><DashboardNav role="admin" /><main><PageIntro eyebrow="Resource CMS" title="Keep useful information current." copy="A quiet stale-content warning appears after 90 days." /><div className="admin-toolbar"><button className="button button-black">Add resource</button><span><AlertTriangle /> {resources.filter((resource) => new Date(resource.lastVerifiedAt) < addDays(new Date(), -90)).length} may need review</span></div><div className="admin-resource-list">{resources.map((resource) => <article key={resource.id}><div><SourceBadge resource={resource} /><h3>{resource.title}</h3><p>Checked {resource.lastVerifiedAt}</p></div><select aria-label={`Status for ${resource.title}`} defaultValue={resource.status}><option value="active">Active</option><option value="needs_review">Needs review</option><option value="archived">Archived</option></select><button className="button button-light" onClick={() => alert(`Demo edit opened for ${resource.title}`)}>Edit</button></article>)}</div></main></div>;
  const sectionData: Record<string, { title: string; copy: string; items: string[] }> = {
    workers: { title: "Manage workers and roles.", copy: "Qualification status is administrative and never shown as a grand biography.", items: ["Maya · active · housing, work, study", "Alex · active · money, food, paid work"] },
    partners: { title: "Manage partner pathways.", copy: "Referral contacts stay private. Future partners are labelled in public content.", items: ["Northside Youth Pathways · demonstration", "Metro Training Link · future partner", "Local Support Hub · demonstration"] },
    locations: { title: "Manage safe meeting locations.", copy: "Show access, transport and privacy information before someone books.", items: ["Collingwood pilot room · accessible entrance", "Footscray community room · near station"] },
    "service-settings": { title: "Set honest service expectations.", copy: "Booking remains available when closed. Live-contact language changes.", items: ["Response hours · Mon–Fri, 9am–6pm", "Appointment duration · 30 minutes", "Buffer · 15 minutes", "Booking window · 21 days"] },
  };
  if (sectionData[section]) { const data = sectionData[section]; return <div className="dashboard-page"><DashboardNav role="admin" /><main><PageIntro eyebrow="Pilot administration" title={data.title} copy={data.copy} /><div className="admin-simple-list">{data.items.map((item) => <article key={item}><CheckCircle2 /><strong>{item}</strong><button className="button button-light">Edit</button></article>)}</div></main></div>; }
  return <div className="dashboard-page"><DashboardNav role="admin" /><main><div className="dashboard-welcome"><span className="eyebrow">Aggregate view only</span><h1>Pilot overview.</h1><p>Participant details do not belong in impact reporting.</p></div><div className="impact-grid compact"><ImpactMetric value={`${state.appointments.length + 18}`} label="Appointments booked · demo" /><ImpactMetric value="68%" label="Pathways completed · demo" /><ImpactMetric value="61%" label="Referrals accepted · demo" /><ImpactMetric value="3" label="Resources need review" /></div><section className="admin-boundary"><ShieldCheck /><div><h2>Privacy boundary active</h2><p>This overview cannot access names, contact details, messages or participant timelines.</p></div></section><h2>Priority checks</h2><div className="admin-simple-list"><article><AlertTriangle /><strong>3 resources have not been checked in 90 days</strong><a className="button button-light" href="/admin/resources">Review</a></article><article><CheckCircle2 /><strong>Service hours are published and current</strong><a className="button button-light" href="/admin/service-settings">View</a></article></div></main></div>;
}

function NotFound() { return <div className="task-page"><EmptyState title="That page took a wrong turn.">Try the useful options or start with one question.<br /><a href="/start">Choose a first step</a></EmptyState></div>; }

export default function FirstStepApp() {
  const pathname = usePathname() || "/";
  const { state, hydrated } = useDemoState();
  const parts = pathname.split("/").filter(Boolean);
  const isDashboard = ["account", "worker", "admin"].includes(parts[0] || "");
  const needsDemoState = ["start", "book", "resources", "demo", "account", "worker", "admin"].includes(parts[0] || "");
  let page: ReactNode;
  if (needsDemoState && !hydrated) page = <div className="task-page"><LoadingState /></div>;
  else if (pathname === "/") page = <HomePage />;
  else if (pathname === "/start") page = <GuidedPathway state={state} />;
  else if (pathname === "/book") page = <BookingPage state={state} />;
  else if (pathname === "/resources") page = <ResourcesPage state={state} />;
  else if (parts[0] === "resources" && parts[1]) page = <ResourceDetail slug={parts[1]} state={state} />;
  else if (parts[0] === "pathways" && parts[1]) page = <PathwayPage type={parts[1]} />;
  else if (["about", "privacy", "consent", "terms", "safety"].includes(parts[0])) page = <StaticPage type={parts[0]} />;
  else if (pathname === "/partners") page = <PartnersPage />;
  else if (pathname === "/impact") page = <ImpactPage />;
  else if (pathname === "/impact-dashboard") page = <ImpactDashboardPage />;
  else if (pathname === "/merch") page = <MerchPage />;
  else if (pathname === "/demo") page = <DemoPage state={state} hydrated={hydrated} />;
  else if (parts[0] === "account") page = <RoleGate required="participant" state={state}><ParticipantPage section={parts[1] || "overview"} state={state} /></RoleGate>;
  else if (parts[0] === "worker") page = <RoleGate required="youth_worker" state={state}><WorkerPage section={parts[1] || "overview"} state={state} /></RoleGate>;
  else if (parts[0] === "admin") page = <RoleGate required="admin" state={state}><AdminPage section={parts[1] || "overview"} state={state} /></RoleGate>;
  else page = <NotFound />;

  return <><a className="skip-link" href="#main">Skip to content</a>{!isDashboard && <DemoModeBanner />}{!isDashboard && <AppHeader />}<main id="main">{page}</main>{!isDashboard && <Footer />}</>;
}
