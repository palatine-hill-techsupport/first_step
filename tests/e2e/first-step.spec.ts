import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function switchRole(page: Page, role: "Participant" | "Youth worker" | "Administrator") {
  await page.goto("/demo");
  const target = role === "Participant" ? "/account" : role === "Youth worker" ? "/worker" : "/admin";
  const roleId = role === "Participant" ? "participant" : role === "Youth worker" ? "youth_worker" : "admin";
  await page.getByRole("button", { name: new RegExp(role, "i") }).click();
  if (new URL(page.url()).pathname !== target) await page.goto(target);
  await page.waitForFunction((expected) => JSON.parse(localStorage.getItem("first_step_demo_state_v1") || "{}").role === expected, roleId);
}

async function bookGuest(page: Page) {
  await page.goto("/book");
  await page.getByRole("checkbox", { name: "Work", exact: true }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Phone/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /First available/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator(".slot-grid button").first().click();
  await page.getByRole("button", { name: /Use this time/ }).click();
  await page.getByLabel("Name you want us to use *").fill("Jamie");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("jamie@example.test");
  await page.getByLabel(/I consent to first_step/).check();
  await page.getByLabel(/I understand first_step/).check();
  await page.getByRole("button", { name: /Book this appointment/ }).click();
  await expect(page.getByRole("heading", { name: "You have a time." })).toBeVisible();
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
  const footerLogo = page.locator(".footer .brand-logo");
  await expect(footerLogo).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
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
  await page.locator('.desktop-nav a[href="/start?restart=1"]').click();
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
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/book", "/resources", "/about", "/merch", "/impact-dashboard"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("key pages have no serious axe violations", async ({ page }) => {
  for (const route of ["/", "/start", "/book", "/resources", "/about", "/merch", "/impact", "/impact-dashboard"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || "")), `${route} accessibility`).toEqual([]);
  }
});
