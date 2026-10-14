const SAMPLE_GUEST = {
  firstName: "Jordan",
  lastName: "Lee",
  phone: "206-555-0142",
  email: "jordan.lee@example.com",
  address1: "21615 64th Ave S",
  address2: "",
  city: "Kent",
  state: "WA",
  postalCode: "98032",
  notes: "Local test guest — no real customer data."
};

const NON_RASKC_GUEST = {
  ...SAMPLE_GUEST,
  address1: "600 4th Ave",
  address2: "",
  city: "Seattle",
  state: "WA",
  postalCode: "98104",
  notes: "Public Seattle City Hall address — expected provider: City of Seattle."
};

const form = document.querySelector("#guest-form");
const preview = document.querySelector("#guest-preview");
const savedStatus = document.querySelector("#saved-status");
const resetButton = document.querySelector("#reset-profile");
const raskcPresetButton = document.querySelector("#use-raskc-address");
const nonRaskcPresetButton = document.querySelector("#use-non-raskc-address");
const extensionStatus = document.querySelector("#extension-status");

function showExtensionConnected() {
  extensionStatus.textContent = "Extension connected — capture is ready";
  extensionStatus.classList.remove("waiting");
  extensionStatus.classList.add("connected");
}

if (document.documentElement.dataset.waitwhileExtensionConnected === "true") showExtensionConnected();
window.addEventListener("waitwhile-extension-connected", showExtensionConnected);

const fieldMap = {
  firstName: "#first-name",
  lastName: "#last-name",
  phone: "#phone",
  email: "#email",
  address1: "#address1",
  address2: "#address2",
  city: "#city",
  state: "#state",
  postalCode: "#postal-code",
  notes: "#notes"
};

function readForm() {
  return Object.fromEntries(Object.entries(fieldMap).map(([key, selector]) => [key, document.querySelector(selector).value.trim()]));
}

function writeForm(guest) {
  for (const [key, selector] of Object.entries(fieldMap)) document.querySelector(selector).value = guest[key] ?? "";
}

function addDetail(label, value) {
  if (!value) return;
  const key = document.createElement("ww-display-object-key");
  const detail = document.createElement("ww-display-object-value");
  key.textContent = label;
  detail.textContent = value;
  preview.append(key, detail);
}

function renderGuest(guest) {
  preview.replaceChildren();
  addDetail("Name", `${guest.firstName} ${guest.lastName}`.trim());
  addDetail("Phone", guest.phone);
  addDetail("Email", guest.email);
  addDetail("Address 1", guest.address1);
  addDetail("Address 2", guest.address2);
  addDetail("City", guest.city);
  addDetail("State", guest.state.toUpperCase());
  addDetail("Zipcode", guest.postalCode);
  addDetail("Notes", guest.notes);
  // The live Waitwhile panel contains a second State field for visit status.
  // This deliberately reproduces that collision so capture should keep the
  // earlier address state (WA) and ignore this later value (Waitlist).
  addDetail("Position", "1");
  addDetail("State", "Waitlist");
  addDetail("Ticket ID", "V859");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderGuest(readForm());
  savedStatus.textContent = "Saved — ready to capture";
});

form.addEventListener("input", () => { savedStatus.textContent = "Unsaved changes"; });
resetButton.addEventListener("click", () => {
  writeForm(SAMPLE_GUEST);
  renderGuest(SAMPLE_GUEST);
  savedStatus.textContent = "Sample restored";
});

function applyPreset(guest, status) {
  writeForm(guest);
  renderGuest(guest);
  savedStatus.textContent = status;
}

raskcPresetButton.addEventListener("click", () => {
  applyPreset(SAMPLE_GUEST, "RASKC address loaded — ready to capture");
});

nonRaskcPresetButton.addEventListener("click", () => {
  applyPreset(NON_RASKC_GUEST, "Non-RASKC address loaded — ready to capture");
});

writeForm(SAMPLE_GUEST);
renderGuest(SAMPLE_GUEST);
