import { createPerson, getFullName, validatePerson } from "./src/models/person.js";
import {
  fillNewPersonForm,
  openCreatePersonForm,
  openVaccineExpress,
  searchByAddress,
  searchByName,
  searchByPhone
} from "./src/petpoint/petpointService.js";
import { fillRaskcPetIdForm } from "./src/petpoint/petpointService.js";
import { clearPerson, loadPerson, savePerson } from "./src/storage/personStorage.js";
import { checkRaskcProvider } from "./src/raskc/raskcService.js";
import {
  FindPersonStep,
  WorkflowStage,
  advanceFindPersonWorkflow,
  beginCreatePerson,
  createFindPersonWorkflow
} from "./src/workflows/findPersonWorkflow.js";

const personNameElement = document.querySelector("#person-name");
const personPhoneElement = document.querySelector("#person-phone");
const personEmailElement = document.querySelector("#person-email");
const personAddressElement = document.querySelector("#person-address");

const loadWaitwhilePersonButton = document.querySelector("#load-waitwhile-person");
const runSearchButton = document.querySelector("#run-search");
const continueSearchButton = document.querySelector("#continue-search");
const resetSearchButton = document.querySelector("#reset-search");
const fillNewPersonButton = document.querySelector("#fill-new-person");
const personFoundButton = document.querySelector("#person-found");
const createNewPersonButton = document.querySelector("#create-new-person");
const matchReviewActionsElement = document.querySelector("#match-review-actions");
const clearPersonButton = document.querySelector("#clear-person");

const workflowStepElement = document.querySelector("#workflow-step");
const statusElement = document.querySelector("#status");
const menuButtons = document.querySelectorAll(".menu-button");
const actionViews = document.querySelectorAll(".action-view");
const raskcAddressElement = document.querySelector("#raskc-address");
const checkRaskcButton = document.querySelector("#check-raskc");
const raskcResultElement = document.querySelector("#raskc-result");
const raskcIdActionsElement = document.querySelector("#raskc-id-actions");
const raskcTagIdInput = document.querySelector("#raskc-tag-id");
const fillRaskcPetIdButton = document.querySelector("#fill-raskc-pet-id");
const workspaceButtons = document.querySelectorAll(".workspace-button");
const workspaceViews = document.querySelectorAll(".workspace-view");
const openRabiesReportsButton = document.querySelector("#open-rabies-reports");

const FAKE_WAITWHILE_URL = "http://localhost:3000/test-pages/fake-waitwhile.html";

function isFakeWaitwhileUrl(url = "") {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname) &&
      parsed.port === "3000" &&
      parsed.pathname === "/test-pages/fake-waitwhile.html";
  } catch {
    return false;
  }
}

let findPersonWorkflow = createFindPersonWorkflow();

function normalizePhone(phone = "") {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

function formatPhone(phone = "") {
  const normalized = normalizePhone(phone);

  if (normalized.length !== 10) {
    return phone;
  }

  return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

function displayPerson(person) {
  if (!person) {
    personNameElement.textContent = "No person selected";
    personPhoneElement.textContent = "";
    personEmailElement.textContent = "";
    personAddressElement.textContent = "";

    runSearchButton.disabled = true;
    continueSearchButton.disabled = true;
    resetSearchButton.disabled = true;
    clearPersonButton.disabled = true;
    checkRaskcButton.disabled = true;
    raskcAddressElement.textContent = "Capture a Waitwhile guest with an address first.";

    return;
  }

  personNameElement.textContent = getFullName(person);
  personPhoneElement.textContent = person.phone ? `Phone · ${formatPhone(person.phone)}` : "";
  personEmailElement.textContent = person.email ? `Email · ${person.email}` : "";
  const address = [person.address1, person.city, person.state, person.postalCode].filter(Boolean).join(", ");
  personAddressElement.textContent = address ? `Address · ${address}` : "";

  runSearchButton.disabled = false;
  continueSearchButton.disabled = true;
  resetSearchButton.disabled = false;
  clearPersonButton.disabled = false;
  checkRaskcButton.disabled = !person.address1;
  raskcAddressElement.textContent = address || "No address was found for this guest.";
  renderWorkflow();
}

function showActionView(viewId, { persist = true } = {}) {
  const validViewId = [...actionViews].some((view) => view.id === viewId)
    ? viewId
    : "petpoint-view";

  for (const button of menuButtons) {
    const selected = button.dataset.view === validViewId;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }

  for (const view of actionViews) view.hidden = view.id !== validViewId;
  if (persist) chrome.storage.local.set({ selectedActionView: validViewId });
}

for (const button of menuButtons) {
  button.addEventListener("click", () => showActionView(button.dataset.view));
}

function showWorkspace(workspaceId, { persist = true } = {}) {
  const validWorkspaceId = [...workspaceViews].some((view) => view.id === workspaceId)
    ? workspaceId
    : "adoptions-workspace";

  for (const button of workspaceButtons) {
    const selected = button.dataset.workspace === validWorkspaceId;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }

  for (const view of workspaceViews) view.hidden = view.id !== validWorkspaceId;
  if (persist) chrome.storage.local.set({ selectedWorkspace: validWorkspaceId });
}

for (const button of workspaceButtons) {
  button.addEventListener("click", () => showWorkspace(button.dataset.workspace));
}

openRabiesReportsButton.addEventListener("click", async () => {
  try {
    openRabiesReportsButton.disabled = true;
    const response = await openVaccineExpress();
    statusElement.textContent = response.message;
  } catch (error) {
    statusElement.textContent = error instanceof Error
      ? error.message
      : "Unable to start the rabies-tag workflow.";
  } finally {
    openRabiesReportsButton.disabled = false;
  }
});

function renderRaskcResult(lookup) {
  if (!lookup || lookup.status === "pending") {
    raskcResultElement.hidden = true;
    raskcIdActionsElement.hidden = true;
    return;
  }

  raskcResultElement.hidden = false;
  raskcResultElement.className = "result-box";

  if (lookup.status === "error") {
    raskcIdActionsElement.hidden = true;
    raskcResultElement.classList.add("error");
    raskcResultElement.textContent = lookup.message || "King County could not check this address.";
  } else if (lookup.isRaskc) {
    raskcIdActionsElement.hidden = false;
    raskcResultElement.textContent = `RASKC is the pet-license provider${lookup.city ? ` for ${lookup.city}` : ""}. The adopter's pet may require a RASKC license.`;
  } else {
    raskcIdActionsElement.hidden = true;
    raskcResultElement.classList.add("not-raskc");
    raskcResultElement.textContent = lookup.provider
      ? `No RASKC action is needed. This address is served by ${lookup.provider}, not RASKC.`
      : "No RASKC action can be completed. The address may be outside King County or could not be matched to a licensing provider.";
  }
}

raskcTagIdInput.addEventListener("input", async () => {
  const tagId = raskcTagIdInput.value.trim();
  fillRaskcPetIdButton.disabled = !tagId;
  await chrome.storage.local.set({ raskcTagId: tagId });
});

fillRaskcPetIdButton.addEventListener("click", async () => {
  try {
    const tagId = raskcTagIdInput.value.trim();
    if (!tagId) throw new Error("Enter the RASKC tag ID first.");
    const response = await fillRaskcPetIdForm(tagId);
    statusElement.textContent = response.message;
  } catch (error) {
    statusElement.textContent = error instanceof Error ? error.message : "Unable to fill the PetPoint ID form.";
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.raskcLookup) renderRaskcResult(changes.raskcLookup.newValue);
});

checkRaskcButton.addEventListener("click", async () => {
  try {
    const person = await loadPerson();
    if (!person?.address1) throw new Error("The captured guest does not have a street address.");

    const address = [person.address1, person.address2, person.city, person.state, person.postalCode]
      .filter(Boolean)
      .join(", ");

    checkRaskcButton.disabled = true;
    checkRaskcButton.textContent = "Checking address…";
    statusElement.textContent = "Checking the address with ArcGIS and King County.";

    const result = await checkRaskcProvider(address);
    const lookup = { status: "complete", address, ...result };
    await chrome.storage.local.set({ raskcLookup: lookup });
    renderRaskcResult(lookup);
    statusElement.textContent = result.isRaskc ? "RASKC result found." : "Licensing-provider result found.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check the address.";
    const lookup = { status: "error", message };
    await chrome.storage.local.set({ raskcLookup: lookup });
    renderRaskcResult(lookup);
    statusElement.textContent = message;
  } finally {
    const person = await loadPerson();
    checkRaskcButton.disabled = !person?.address1;
    checkRaskcButton.textContent = "Check license provider";
  }
});

function renderWorkflow() {
  if (findPersonWorkflow.stage === WorkflowStage.CREATE_PERSON) {
    workflowStepElement.textContent = "Create New Person";
    runSearchButton.textContent = "Fill Person Form";
    runSearchButton.disabled = false;
    continueSearchButton.disabled = true;
    fillNewPersonButton.hidden = true;
    matchReviewActionsElement.hidden = true;
    createNewPersonButton.hidden = true;
    return;
  }

  const configuration = {
    [FindPersonStep.NAME]: {
      label: "Step 1: Search by name",
      button: "Search by Name",
      next: "Continue to Phone"
    },
    [FindPersonStep.PHONE]: {
      label: "Step 2: Verify by phone",
      button: "Search by Phone",
      next: "Continue to Address"
    },
    [FindPersonStep.ADDRESS]: {
      label: "Step 3: Verify by address",
      button: "Search by Address",
      next: "Continue to Review"
    },
    [FindPersonStep.REVIEW]: {
      label: "Review the possible PetPoint matches",
      button: "Search Complete",
      next: "Review in PetPoint"
    }
  };

  const current = configuration[findPersonWorkflow.currentStep];

  workflowStepElement.textContent = current.label;
  runSearchButton.textContent = current.button;
  continueSearchButton.textContent = current.next;

  runSearchButton.disabled = findPersonWorkflow.currentStep === FindPersonStep.REVIEW;
  continueSearchButton.disabled = true;
  fillNewPersonButton.hidden = true;
  createNewPersonButton.hidden = false;
  matchReviewActionsElement.hidden = findPersonWorkflow.currentStep !== FindPersonStep.REVIEW;
}

async function loadSavedPerson() {
  const person = await loadPerson();
  displayPerson(person);
}

loadWaitwhilePersonButton.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const isWaitwhile = tab?.url?.includes(".waitwhile.com/");
    const isFakeWaitwhile = isFakeWaitwhileUrl(tab?.url);

    if (!tab?.id || (!isWaitwhile && !isFakeWaitwhile)) {
      throw new Error("Open a guest in Waitwhile or the fake Waitwhile page, then click this button.");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "WAITWHILE_EXTRACT_PERSON"
    });

    if (!response?.success) {
      throw new Error(response?.message ?? "Unable to read the Waitwhile guest.");
    }

    const person = createPerson(response.person);
    const validationErrors = validatePerson(person);
    await savePerson(person);
    await chrome.storage.local.remove("raskcLookup");
    await chrome.storage.local.remove("raskcTagId");
    raskcTagIdInput.value = "";
    fillRaskcPetIdButton.disabled = true;
    renderRaskcResult(null);
    findPersonWorkflow = createFindPersonWorkflow();
    displayPerson(person);
    statusElement.textContent = validationErrors.length
      ? `Loaded from Waitwhile with issues: ${validationErrors.join(", ")}`
      : "Waitwhile guest loaded. Open PetPoint to search or fill the form.";
  } catch (error) {
    console.error(error);
    statusElement.textContent = error.message?.includes("Receiving end does not exist")
      ? "Reload the extension and refresh Waitwhile, then try again."
      : error.message;
  }
});

async function runPetPointSearch(searchAction) {
  const person = await loadPerson();

  if (!person) {
    throw new Error("No person is currently loaded.");
  }

  const response = await searchAction(person);
  statusElement.textContent = response.message;
}

async function runCurrentSearch(person) {
  switch (findPersonWorkflow.currentStep) {
    case FindPersonStep.NAME:
      return searchByName(person);

    case FindPersonStep.PHONE:
      return searchByPhone(person);

    case FindPersonStep.ADDRESS:
      return searchByAddress(person);

    case FindPersonStep.REVIEW:
      throw new Error("The search is ready for review.");

    default:
      throw new Error("Unknown workflow step.");
  }
}

runSearchButton.addEventListener("click", async () => {
  try {
    const person = await loadPerson();

    if (!person) {
      throw new Error("No person is loaded.");
    }

    if (findPersonWorkflow.stage === WorkflowStage.CREATE_PERSON) {
      const response = await fillNewPersonForm(person);
      statusElement.textContent = response.message;
      return;
    }

    const response = await runCurrentSearch(person);

    statusElement.textContent = response.message;
    continueSearchButton.disabled = false;
  } catch (error) {
    console.error(error);
    statusElement.textContent = error.message;
  }
});

fillNewPersonButton.addEventListener("click", async () => {
  try {
    const person = await loadPerson();

    if (!person) {
      throw new Error("Load a person before filling the form.");
    }

    const response = await fillNewPersonForm(person);
    statusElement.textContent = response.message;
  } catch (error) {
    console.error(error);
    statusElement.textContent = error instanceof Error ? error.message : "Unable to fill the person form.";
  }
});

continueSearchButton.addEventListener("click", () => {
  findPersonWorkflow = advanceFindPersonWorkflow(findPersonWorkflow);
  renderWorkflow();
});

createNewPersonButton.addEventListener("click", async () => {
  try {
    const response = await openCreatePersonForm();
    findPersonWorkflow = beginCreatePerson(findPersonWorkflow);
    renderWorkflow();
    statusElement.textContent = response.message;
  } catch (error) {
    console.error(error);
    statusElement.textContent = error.message;
  }
});

personFoundButton.addEventListener("click", () => {
  findPersonWorkflow = {
    ...findPersonWorkflow,
    stage: WorkflowStage.COMPLETE
  };
  renderWorkflow();
  statusElement.textContent = "Marked as person found.";
});

resetSearchButton.addEventListener("click", async () => {
  findPersonWorkflow = createFindPersonWorkflow();
  renderWorkflow();
  statusElement.textContent = "Search workflow restarted.";
});

clearPersonButton.addEventListener("click", async () => {
  await clearPerson();
  await chrome.storage.local.remove("raskcLookup");
  await chrome.storage.local.remove("raskcTagId");

  findPersonWorkflow = createFindPersonWorkflow();
  displayPerson(null);
  createNewPersonButton.hidden = false;
  matchReviewActionsElement.hidden = true;
  renderRaskcResult(null);
  statusElement.textContent = "Person cleared.";
});

loadSavedPerson().catch((error) => {
  console.error(error);
  statusElement.textContent = "Unable to load saved person.";
});

chrome.storage.local.get("raskcLookup").then(({ raskcLookup }) => renderRaskcResult(raskcLookup));
chrome.storage.local.get("raskcTagId").then(({ raskcTagId = "" }) => {
  raskcTagIdInput.value = raskcTagId;
  fillRaskcPetIdButton.disabled = !raskcTagId.trim();
});
chrome.storage.local.get("selectedActionView").then(({ selectedActionView = "petpoint-view" }) => {
  showActionView(selectedActionView, { persist: false });
});
chrome.storage.local.get("selectedWorkspace").then(({ selectedWorkspace = "adoptions-workspace" }) => {
  showWorkspace(selectedWorkspace, { persist: false });
});
