import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CONFIDENTIAL_NOTES_INTRO =
  "Your worker may take brief, confidential notes during or after your appointment. These help us remember what you have told us and provide consistent support.";
const CONFIDENTIAL_NOTES_LIMITS =
  "We do not share these notes with another service without your permission, unless we believe you or someone else may be at serious risk of harm. Your worker can explain this before the conversation begins, and you can ask questions at any time.";
const ACKNOWLEDGEMENT_OF_COUNTRY =
  "first_step acknowledges the Traditional Owners of Country throughout Victoria and recognises their continuing connection to lands, waters and communities. We pay our respects to Aboriginal and Torres Strait Islander cultures, and to Elders past and present.";

type BookingContactMethod = "email" | "phone" | "sms";

interface BookingOptions {
  name?: string;
  ageBand?: "15–17" | "18–25";
  contactMethod?: BookingContactMethod;
  email?: string;
  phone?: string;
  safeContactNotes?: string;
}

async function switchRole(page: Page, role: "Participant" | "Youth worker" | "Administrator") {
  await page.goto("/demo");
  const target = role === "Participant" ? "/account" : role === "Youth worker" ? "/worker" : "/admin";
  const roleId = role === "Participant" ? "participant" : role === "Youth worker" ? "youth_worker" : "admin";
  await page.getByRole("button", { name: new RegExp(role, "i") }).click();
  if (new URL(page.url()).pathname !== target) await page.goto(target);
  await page.waitForFunction((expected) => JSON.parse(localStorage.getItem("first_step_demo_state_v1") || "{}").role === expected, roleId);
}

async function reachBookingDetails(page: Page) {
  await page.goto("/book");
  await page.getByRole("checkbox", { name: "Work", exact: true }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Phone/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /First available/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator(".slot-grid button").first().click();
  await page.getByRole("button", { name: /Use this time/ }).click();
  await expect(page.getByRole("heading", { name: "Just enough detail to run the appointment." })).toBeVisible();
}

async function fillBookingDetails(page: Page, options: BookingOptions = {}) {
  const contactMethod = options.contactMethod ?? "email";
  await page.getByLabel("Name you want us to use *").fill(options.name ?? "Jamie");
  await page.getByLabel("Age band *").selectOption({ label: options.ageBand ?? "18–25" });
  await page.getByLabel("How should we contact you? *").selectOption(contactMethod);
  if (contactMethod === "email") {
    await page.getByLabel("Email *").fill(options.email ?? "jamie@example.test");
  } else {
    const label = contactMethod === "sms" ? "Mobile number *" : "Phone number *";
    await page.getByLabel(label).fill(options.phone ?? "0412 345 678");
  }
  const safeContactLabel = contactMethod === "email"
    ? "It is safe to send an email"
    : contactMethod === "phone"
      ? "It is safe to call"
      : "It is safe to send an SMS/text message";
  await page.getByLabel(safeContactLabel, { exact: true }).check();
  if (options.safeContactNotes) {
    await page.getByLabel("Anything we should know before contacting you? Optional").fill(options.safeContactNotes);
  }
  await page.getByLabel(/I consent to first_step/).check();
  await page.getByLabel(/I understand first_step/).check();
}

async function submitBooking(page: Page, options: BookingOptions = {}) {
  await page.getByRole("button", { name: /Book this appointment/ }).click();
  const firstName = (options.name ?? "Jamie").trim().split(/\s+/)[0];
  await expect(page.getByRole("heading", { name: `Hi ${firstName}, your appointment is booked.` })).toBeVisible();
}

async function bookGuest(page: Page, options: BookingOptions = {}) {
  await reachBookingDetails(page);
  await fillBookingDetails(page, options);
  await submitBooking(page, options);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
  ) - window.innerWidth);
  expect(overflow, label).toBeLessThanOrEqual(0);
}

async function expectNoSeriousAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || "")),
    label,
  ).toEqual([]);
}

test("mobile participant completes guided pathway", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: /work or money/ }).click();
  await page.getByRole("button", { name: /Show me options/ }).click();
  await page.getByRole("button", { name: "Any format" }).click();
  await page.getByRole("button", { name: /Show my next step/ }).click();
  await expect(page.getByText("Your strongest next step")).toBeVisible();
});

test("urgent housing bypasses quiz", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: /somewhere safe/ }).click();
  await expect(page.getByText("You do not need to finish a quiz.")).toBeVisible();
  await expect(page.getByText("1800 825 955").first()).toBeVisible();
});

test("guest books a youth-worker appointment", async ({ page }) => { await bookGuest(page); });

test("booking includes the 15–17 age band", async ({ page }) => {
  await reachBookingDetails(page);
  const ageBand = page.getByLabel("Age band *");
  await expect(ageBand.locator("option")).toHaveText(["15–17", "18–25"]);
  await ageBand.selectOption({ label: "15–17" });
  await expect(ageBand).toHaveValue("15–17");
});

test("contact method fields validate inline and focus the first invalid field", async ({ page }) => {
  await reachBookingDetails(page);
  await page.getByLabel("Name you want us to use *").fill("Jamie");
  await page.getByLabel(/I consent to first_step/).check();
  await page.getByLabel(/I understand first_step/).check();

  const email = page.getByLabel("Email *");
  await expect(email).toBeVisible();
  await expect(page.getByLabel("Phone number *")).toHaveCount(0);
  await email.fill("not-an-email");
  await page.getByRole("button", { name: /Book this appointment/ }).click();
  await expect(email.locator("..").getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toBeFocused();

  await page.getByLabel("How should we contact you? *").selectOption("phone");
  await expect(page.getByLabel("Email *")).toHaveCount(0);
  const phone = page.getByLabel("Phone number *");
  await expect(phone).toBeVisible();
  await phone.fill("123");
  await page.getByRole("button", { name: /Book this appointment/ }).click();
  await expect(phone.locator("..").getByText("Add a working phone number.", { exact: true })).toBeVisible();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toBeFocused();

  await page.getByLabel("How should we contact you? *").selectOption("sms");
  await expect(page.getByLabel("Phone number *")).toHaveCount(0);
  const mobile = page.getByLabel("Mobile number *");
  await expect(mobile).toBeVisible();
  await expect(page.getByText("Use a mobile number that can receive text messages.", { exact: true })).toBeVisible();
  await mobile.fill("456");
  await page.getByRole("button", { name: /Book this appointment/ }).click();
  await expect(mobile.locator("..").getByText("Add a working phone number.", { exact: true })).toBeVisible();
  await expect(mobile).toHaveAttribute("aria-invalid", "true");
  await expect(mobile).toBeFocused();
});

test("safe contact instructions persist only in participant and worker management views", async ({ page }) => {
  const contactInstructions = "Please call after 4pm and use the name Jay.";
  await reachBookingDetails(page);
  const notes = page.getByLabel("Anything we should know before contacting you? Optional");
  await expect(page.getByText("500 characters remaining", { exact: true })).toBeVisible();
  await notes.fill(contactInstructions);
  await expect(page.getByText(`${500 - contactInstructions.length} characters remaining`, { exact: true })).toBeVisible();
  await fillBookingDetails(page, { safeContactNotes: contactInstructions });
  await submitBooking(page);

  const confirmation = page.locator(".confirmation-panel");
  await expect(confirmation.getByText(contactInstructions, { exact: true })).toHaveCount(0);
  await confirmation.getByRole("link", { name: "Manage appointment" }).click();
  await expect(page).toHaveURL(/\/account\/appointments\?manage=/);
  await expect(page.getByText(contactInstructions, { exact: true })).toBeVisible();
  await expect(page.getByText("Contact instructions", { exact: true })).toBeVisible();

  await switchRole(page, "Youth worker");
  await expect(page.getByText(contactInstructions, { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Private booking contact details" })).toBeVisible();
});

test("booking explains confidential notes and links to full policy pages", async ({ page }) => {
  await reachBookingDetails(page);
  const form = page.locator(".details-form");
  await expect(form.getByText(CONFIDENTIAL_NOTES_INTRO, { exact: true })).toBeVisible();
  await expect(form.getByText(CONFIDENTIAL_NOTES_LIMITS, { exact: true })).toBeVisible();
  await expect(form.getByRole("link", { name: "Read about consent" })).toHaveAttribute("href", "/consent");
  await expect(form.getByRole("link", { name: "Read about privacy" })).toHaveAttribute("href", "/privacy");

  for (const route of ["/consent", "/privacy"]) {
    await page.goto(route);
    await expect(page.getByText(CONFIDENTIAL_NOTES_INTRO, { exact: true })).toBeVisible();
    await expect(page.getByText(CONFIDENTIAL_NOTES_LIMITS, { exact: true })).toBeVisible();
    await expect(page.getByText(/serious risk/i).first()).toBeVisible();
  }
});

test("confirmation is actionable, transparent and survives refresh", async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 500 });
  await reachBookingDetails(page);
  await expectNoHorizontalOverflow(page, "booking details at 500px");
  const options: BookingOptions = { contactMethod: "sms", phone: "0412 345 678" };
  await fillBookingDetails(page, options);
  await submitBooking(page, options);

  const confirmation = page.locator(".confirmation-panel");
  await expect(confirmation.locator("dl").getByText("SMS/text", { exact: true })).toBeVisible();
  await expect(confirmation.locator("dl").getByText(/Australia\/Melbourne/)).toBeVisible();
  await expect(confirmation.getByRole("link", { name: "Manage appointment" })).toHaveAttribute("href", /\/account\/appointments\?manage=.+/);
  await expect(confirmation.getByRole("link", { name: "Consent", exact: true })).toHaveAttribute("href", "/consent");
  await expect(confirmation.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
  await expectNoHorizontalOverflow(page, "booking confirmation at 500px");

  const confirmationUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(confirmationUrl);
  await expect(page.getByRole("heading", { name: "Hi Jamie, your appointment is booked." })).toBeVisible();
  await expect(page.locator(".confirmation-panel dl").getByText("SMS/text", { exact: true })).toBeVisible();
});

test("guest reschedules an appointment", async ({ page }) => {
  await bookGuest(page);
  await page.goto("/account/appointments");
  await page.getByRole("button", { name: "Move one week later" }).click();
  await expect(page.getByText(/Upcoming/)).toBeVisible();
});

test("guest cancels an appointment", async ({ page }) => {
  await bookGuest(page);
  await page.goto("/account/appointments");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("No upcoming appointments.")).toBeVisible();
});

test("signed-in participant saves a resource", async ({ page }) => {
  await page.goto("/resources");
  await page.getByLabel(/Save Kids Helpline/).click();
  await expect(page.getByLabel(/Save Kids Helpline/)).toContainText("Saved");
});

test("worker updates availability", async ({ page }) => {
  await switchRole(page, "Youth worker");
  await page.goto("/worker/availability");
  await page.getByLabel("Friday").check();
  await page.getByRole("button", { name: "Save availability" }).click();
});

test("worker confirms appointment", async ({ page }) => {
  await switchRole(page, "Participant"); await bookGuest(page);
  await switchRole(page, "Youth worker");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("confirmed").first()).toBeVisible();
});

test("worker views warm-referral queue", async ({ page }) => {
  await switchRole(page, "Youth worker");
  await page.goto("/worker/referrals");
  await expect(page.getByText("Northside Youth Pathways")).toBeVisible();
});

test("participant consents to referral", async ({ page }) => {
  await switchRole(page, "Participant");
  await page.goto("/account/referrals");
  await page.getByRole("button", { name: /I consent/ }).click();
  await expect(page.getByText("consented")).toBeVisible();
});

test("admin edits a resource", async ({ page }) => {
  await switchRole(page, "Administrator");
  await page.goto("/admin/resources");
  await page.getByRole("button", { name: "Edit" }).first().click();
});

test("public impact view cannot access private participant data", async ({ page }) => {
  await page.goto("/impact");
  await expect(page.getByText(/No names, contact details, messages or participant timelines/)).toBeVisible();
  await expect(page.getByText("jamie@example.test")).toHaveCount(0);
});

test("keyboard reaches the booking flow", async ({ page }) => {
  await page.goto("/book");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("booking topics and mobile progress are complete", async ({ page }) => {
  await page.goto("/book");
  await expect(page.getByRole("checkbox")).toHaveCount(8);
  await page.getByRole("checkbox", { name: "Something else" }).check();
  await expect(page.getByText("1 topic selected")).toBeVisible();
  await expect(page.getByText("Step 1 of 6")).toBeAttached();
});

test("resource filters, status language and urgent actions are complete", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByPlaceholder("Search by service or need")).toBeVisible();
  await expect(page.getByLabel("Topic")).toHaveValue("All topics");
  await expect(page.getByLabel("Format")).toHaveValue("Any format");
  await expect(page.getByText("Future partner example").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Call Kids Helpline" })).toHaveAttribute("href", "tel:1800551800");
  await page.getByPlaceholder("Search by service or need").fill("no-result-on-purpose");
  await expect(page.getByRole("button", { name: "Clear filters" }).first()).toBeVisible();
});

test("public navigation and footer branding expose polished states", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator('.desktop-nav a[href="/about"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('.desktop-nav a[href="/"]')).toHaveText("Home");
  await expect(page.getByRole("button", { name: "Quick exit to TikTok" })).toHaveCount(2);
  const footerLogo = page.locator(".footer .brand-logo");
  await expect(footerLogo).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("About explains the service boundary and all five commitments", async ({ page }) => {
  await page.goto("/about");
  for (const label of [
    "Why first_step exists",
    "Who it is for",
    "What it can help with",
    "What it cannot provide",
    "How the approach works",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Young people aged 15–25/)).toBeVisible();

  const commitments = page.locator(".commitment-list > li");
  await expect(commitments).toHaveCount(5);
  await expect(commitments.getByRole("heading")).toHaveText([
    "Start safely",
    "Understand the next step",
    "Stay in control",
    "Connect, not replace",
    "Move at your pace",
  ]);
  await expect(page.getByText("first_step is not an emergency or 24-hour service.", { exact: true })).toBeVisible();
});

test("FAQ exposes ten keyboard-operable disclosure buttons", async ({ page }) => {
  await page.goto("/faq");
  const questions = page.locator(".faq-list").getByRole("button");
  await expect(questions).toHaveCount(10);
  await expect(questions).toHaveText([
    "Is first_step an emergency or crisis service?",
    "Who can use first_step?",
    "What happens during an appointment?",
    "Will the worker take notes?",
    "Who can see my information?",
    "Will anything be shared without my permission?",
    "Can I change or cancel an appointment?",
    "What if phone or email contact is not safe?",
    "What happens after I agree to a referral?",
    "Do I need to tell you everything?",
  ]);

  const firstQuestion = questions.first();
  const controlledPanel = await firstQuestion.getAttribute("aria-controls");
  expect(controlledPanel).toBeTruthy();
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  await firstQuestion.focus();
  await page.keyboard.press("Enter");
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`#${controlledPanel}`)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(`#${controlledPanel}`)).toBeHidden();
});

test("footer uses the corrected Acknowledgement of Country", async ({ page }) => {
  await page.goto("/faq");
  await expect(page.locator(".acknowledgement")).toHaveText(ACKNOWLEDGEMENT_OF_COUNTRY);
});

test("safety page has one clear page heading", async ({ page }) => {
  await page.goto("/safety");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Need somewhere safe tonight?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Immediate danger/ })).toHaveAttribute("href", "tel:000");
});

test("start navigation and the visible reset control restart the guided flow", async ({ page }) => {
  await page.goto("/start");
  const firstChoice = page.getByRole("button", { name: "I want to talk to someone" });
  await expect(firstChoice).toHaveCount(1);
  await firstChoice.click();
  const restart = page.getByRole("button", { name: "Restart this guide" });
  await expect(restart).toHaveCount(1);
  await restart.click();
  await expect(firstChoice).toBeVisible();
  const desktopStartLink = page.locator('.desktop-nav a[href="/start?restart=1"]');
  if (await desktopStartLink.isVisible()) {
    await desktopStartLink.click();
  } else {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: /Start here/ }).click();
  }
  await expect(firstChoice).toBeVisible();
});

test("merch store uses all five supplied product mockups", async ({ page }) => {
  await page.goto("/merch");
  await expect(page.locator(".product-grid article")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Community rally jacket" })).toBeVisible();
  await expect(page.getByText("No pretend checkout")).toBeVisible();
});

test("partner impact dashboard keeps its demonstration and privacy boundaries visible", async ({ page }) => {
  await page.goto("/impact-dashboard");
  await expect(page.getByText("Demonstration pilot data").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Did the bridge work?" })).toBeVisible();
  await expect(page.getByText("67% completed a guided pathway")).toBeVisible();
  await expect(page.getByText("Sponsor funding does not purchase access to participant data.")).toBeVisible();
  await expect(page.getByText("jamie@example.test")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Partner impact demo" })).toHaveCount(1);
});

test("key layouts do not overflow at required breakpoints", async ({ page }) => {
  const routes = ["/", "/book", "/resources", "/about", "/faq", "/privacy", "/consent", "/safety", "/merch", "/impact-dashboard"];
  for (const width of [375, 500, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      if (route === "/faq") {
        await page.getByRole("button", { name: "Who can see my information?" }).click();
      }
      await expectNoHorizontalOverflow(page, `${route} at ${width}px`);
    }
  }
});

test("key pages have no serious axe violations", async ({ page }) => {
  for (const route of ["/", "/start", "/book", "/resources", "/about", "/faq", "/privacy", "/consent", "/safety", "/merch", "/impact", "/impact-dashboard"]) {
    await page.goto(route);
    await expectNoSeriousAxeViolations(page, `${route} accessibility`);
  }
});

test("booking details and confirmation have no serious axe violations", async ({ page }) => {
  await reachBookingDetails(page);
  await expectNoSeriousAxeViolations(page, "booking details accessibility");
  const options: BookingOptions = { contactMethod: "phone", phone: "0412 345 678" };
  await fillBookingDetails(page, options);
  await submitBooking(page, options);
  await expectNoSeriousAxeViolations(page, "booking confirmation accessibility");
});
