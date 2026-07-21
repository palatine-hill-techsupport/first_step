export type ReportMetric = {
  id: string;
  label: string;
  value: number;
  note: string;
  status?: string;
};

export type FunnelStage = {
  id: string;
  label: string;
  value: number;
  note?: string;
};

export const demonstrationReport = {
  pilot: {
    name: "Pilot 001",
    period: "Eight-week demonstration pilot",
    format: ["One TAFE-campus pop-up", "Online channel active throughout", "Scheduled youth-worker appointments", "Warm referrals into existing services", "Small paid-opportunity and placement pathway"],
  },
  metrics: {
    boothInteractions: 186,
    platformVisits: 1284,
    guidedPathwaysStarted: 214,
    guidedPathwaysCompleted: 143,
    platformSignUps: 92,
    appointmentsBooked: 47,
    appointmentsCompleted: 39,
    referralsOffered: 38,
    referralsConsented: 31,
    referralsSent: 28,
    referralsAccepted: 24,
    paidOpportunitiesCreated: 9,
    placementsBegan: 6,
    averageReadinessChange: 1.2,
    participantRating: 4.4,
    partnerRating: 4.2,
    sponsorRenewalInterest: 75,
    pilotBudget: 15000,
  },
  coreMetrics: [
    { id: "booth", label: "Booth interactions", value: 186, note: "One public activation made the service visible.", status: "Above pilot assumption" },
    { id: "signups", label: "Platform sign-ups", value: 92, note: "People who chose a way to return.", status: "Needs further testing" },
    { id: "appointments", label: "Appointments completed", value: 39, note: "83% of booked conversations were attended.", status: "Strongest conversion point" },
    { id: "referrals", label: "Accepted referrals", value: 24, note: "77% of consented referrals were accepted by a delivery partner.", status: "Small sample" },
    { id: "opportunities", label: "Paid opportunities", value: 9, note: "Paid roles or lawful structured placements only.", status: "Needs further testing" },
    { id: "confidence", label: "Confidence change", value: 1.2, note: "Average self-rating change on a five-point scale.", status: "Small sample" },
  ] satisfies ReportMetric[],
  funnel: [
    { id: "visits", label: "Platform visits", value: 1284 },
    { id: "started", label: "Guided pathways started", value: 214 },
    { id: "completed", label: "Pathways completed", value: 143 },
    { id: "signups", label: "Sign-ups", value: 92 },
    { id: "booked", label: "Appointments booked", value: 47 },
    { id: "attended", label: "Appointments completed", value: 39 },
    { id: "consented", label: "Referrals consented to", value: 31 },
    { id: "accepted", label: "Referrals accepted", value: 24 },
    { id: "placements", label: "Participants beginning a paid placement", value: 6 },
  ] satisfies FunnelStage[],
  channels: [
    { name: "Public pop-up", interactions: 186, visits: 74, signUps: 31, appointments: 18, acceptedReferrals: 12, note: "Generated trust and awareness." },
    { name: "Online and return visits", interactions: 0, visits: 1210, signUps: 61, appointments: 29, acceptedReferrals: 12, note: "Extended the life of the activation." },
  ],
  referrals: {
    offered: 38,
    consented: 31,
    sent: 28,
    accepted: 24,
    awaiting: 4,
    declined: 3,
    reconsidered: 3,
    categories: [
      ["Housing and youth support", 9],
      ["Study and training", 6],
      ["Work-readiness support", 5],
      ["Financial, food or transport support", 4],
    ] as const,
  },
  placements: { created: 9, began: 6, anotherPathway: 2, unmatched: 1 },
  confidence: { before: 2.5, after: 3.7, responses: 28 },
  participantFeedback: {
    rating: 4.4,
    respected: 89,
    understoodNextStep: 82,
    wouldReturn: 86,
    responses: 28,
    quotes: [
      "I could look first without having to explain everything.",
      "Knowing what would happen after I booked made it less stressful.",
      "The worker did not just send me another link.",
      "I was not ready the first time. It helped that I could come back.",
    ],
  },
  stakeholderFeedback: {
    partners: { rating: 4.2, enoughInformation: 83, boundariesClear: 92, repeatPilot: "4 of 5 partners" },
    sponsors: { renewalInterest: 75, credibleReporting: 100, staffEngagement: 75, wantedLongerTermReporting: 50 },
  },
  learnings: [
    ["The public activation opened the door", "The pop-up made the service visible and normal, especially for people who may not actively search for homelessness support."],
    ["The quieter second door mattered", "Most appointments came from online and return visits rather than at the event itself."],
    ["Explain what happens next", "Resources and booking options performed better when they stated the cost, contact method and likely next step."],
    ["Follow-up must stay consent-led", "Participants valued being able to come back without repeated unsolicited contact."],
  ] as const,
  limitations: [
    "Whether outcomes were sustained long term",
    "Whether accepted referrals led to stable housing",
    "Whether paid placements continued",
    "Whether confidence changes lasted",
    "Whether the model works outside one local pilot",
    "Whether the sponsor model is financially sustainable",
    "Whether people who did not engage found the service useful",
    "Whether the same outcomes would occur at a larger scale",
  ],
  recommendations: [
    "Shorten the gap between pathway completion and booking.",
    "Test optional text reminders for appointments.",
    "Add stronger return-later and save-without-an-account options.",
    "Recruit more partners for housing and paid-work pathways.",
    "Extend follow-up measurement to three and six months.",
  ],
} as const;

export const reportPercent = (part: number, whole: number) => Math.round((part / whole) * 100);
export const reportCurrency = (value: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);
