export const POLICY_REVIEW_NOTICE =
  "Draft pilot wording — the youth-work, safeguarding and privacy leads must approve this content before a live pilot.";

export const ACKNOWLEDGEMENT_OF_COUNTRY =
  "first_step acknowledges the Traditional Owners of Country throughout Victoria and recognises their continuing connection to lands, waters and communities. We pay our respects to Aboriginal and Torres Strait Islander cultures, and to Elders past and present.";

export const CONFIDENTIAL_NOTES_COPY = {
  intro:
    "Your worker may take brief, confidential notes during or after your appointment. These help us remember what you have told us and provide consistent support.",
  limits:
    "We do not share these notes with another service without your permission, unless we believe you or someone else may be at serious risk of harm. Your worker can explain this before the conversation begins, and you can ask questions at any time.",
} as const;

export const FIRST_STEP_COMMITMENTS = [
  {
    title: "Start safely",
    copy: "Choose the contact option that feels most comfortable. You do not need to explain everything at once.",
  },
  {
    title: "Understand the next step",
    copy: "We help make support, study, work and referrals easier to understand and access.",
  },
  {
    title: "Stay in control",
    copy: "Nothing is shared with a partner without clear consent, except where someone may be at serious risk of harm.",
  },
  {
    title: "Connect, not replace",
    copy: "first_step is a bridge into qualified services. It is not an emergency, housing, legal or clinical service.",
  },
  {
    title: "Move at your pace",
    copy: "The aim is to make one useful next step easier, not force a complete pathway.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is first_step an emergency or crisis service?",
    answer:
      "No. first_step offers scheduled appointments and is not monitored 24 hours a day. Call 000 if someone is in immediate danger. If you need somewhere safe tonight, use the urgent-support options on this site.",
  },
  {
    question: "Who can use first_step?",
    answer:
      "first_step is designed for young people aged 15–25 who are experiencing housing instability, or feel they may be at risk. You do not need to prove that things are bad enough before taking a first step.",
  },
  {
    question: "What happens during an appointment?",
    answer:
      "A scheduled appointment is a 30-minute conversation with a youth worker. You can bring one question, talk through a practical next step, or simply say you are not sure yet. You do not need to give a full personal history.",
  },
  {
    question: "Will the worker take notes?",
    answer:
      "They may take brief, confidential notes during or after the appointment so they can remember what you have said and provide consistent support. You can ask what is being recorded at any time.",
  },
  {
    question: "Who can see my information?",
    answer:
      "Your assigned worker and authorised pilot administrators can see the details needed to arrange and support your appointment. A referral partner sees only information you have agreed to share. Sponsors see grouped pilot results, not participant-level information.",
  },
  {
    question: "Will anything be shared without my permission?",
    answer:
      "A referral is not sent to another service without your clear permission. The separate safeguarding exception is when a worker believes you or someone else may be at serious risk of harm. Your worker can explain this boundary and answer questions before the conversation begins.",
  },
  {
    question: "Can I change or cancel an appointment?",
    answer:
      "Yes. Use the management action in your booking confirmation to change or cancel without explaining why. If that contact is no longer safe, use the same action as soon as you can.",
  },
  {
    question: "What if phone or email contact is not safe?",
    answer:
      "Choose email, phone call or SMS/text based on what feels safest, then use the optional contact-instructions box to name a safer time, the name we should use, or whether a message can be left. You can change or cancel if the choice stops feeling safe.",
  },
  {
    question: "What happens after I agree to a referral?",
    answer:
      "You see the partner, the reason for the referral and the exact information proposed for sharing first. If you agree, only those approved details are sent. The partner is responsible for its own service and will explain its next step.",
  },
  {
    question: "Do I need to tell you everything?",
    answer:
      "No. Share only what feels useful for the step you want to take. You can pause, ask a question, change direction or decide not to continue.",
  },
] as const;

export const PILOT_READINESS_ITEMS = [
  "Formal safeguarding policies and procedures are approved.",
  "Staff complete safeguarding training before working with young people.",
  "Roles and responsibilities are defined and understood.",
  "Confidential record-keeping procedures are approved and tested.",
  "Workers have a clear process for identifying risk.",
  "Reporting and escalation pathways are documented and rehearsed.",
  "Referral partners agree to their responsibilities before receiving referrals.",
  "Immediate-risk-of-harm procedures are clear, current and available to staff.",
] as const;
