const pathwayTool = document.querySelector("#pathway-tool");
const pathwayResult = document.querySelector("#pathway-result");

const pathwayCopy = {
  unstable: {
    title: "Start with a youth-worker check-in.",
    body:
      "A short conversation can map what is urgent, what can wait, and which partner pathway is safest. No one needs to share a full story at a booth or in chat.",
    steps: [
      "Confirm immediate safety and basic needs.",
      "Map one support, study, or work option.",
      "Offer a warm referral instead of another cold link."
    ]
  },
  work: {
    title: "Start with one paid-work-ready task.",
    body:
      "A tiny work step is easier to try than a full program. The aim is confidence, not pressure.",
    steps: [
      "Pick resume, interview, clothing, or transport support.",
      "Match with a first-shift or paid placement lead if available.",
      "Keep follow-up with a real person, not a dead resource list."
    ]
  },
  study: {
    title: "Start with one study option that fits this week.",
    body:
      "Study pathways should feel reachable, especially when home, money, transport, or confidence are shaky.",
    steps: [
      "Map TAFE, VCE VM, or short-course options.",
      "Check transport, timing, and support needs first.",
      "Use a warm handover to a campus or pathway contact."
    ]
  }
};

const supportLabels = {
  food: "food",
  transport: "transport",
  clothes: "clothing",
  chat: "chat support"
};

function renderResult(type, supports) {
  const selected = pathwayCopy[type] || pathwayCopy.unstable;
  const supportText = supports.map((support) => supportLabels[support] || support);
  const extras = supports.length
    ? `<p class="support-note"><strong>Bring into the conversation:</strong> ${supportText.join(", ")}.</p>`
    : "";

  pathwayResult.innerHTML = `
    <p class="tag">Suggested first step</p>
    <h3>${selected.title}</h3>
    <p>${selected.body}</p>
    ${extras}
    <ul>
      ${selected.steps.map((step) => `<li>${step}</li>`).join("")}
    </ul>
  `;
}

pathwayTool?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(pathwayTool);
  const type = formData.get("starting");
  const supports = formData.getAll("support");
  renderResult(type, supports);
});
