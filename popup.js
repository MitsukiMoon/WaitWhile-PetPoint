import { createPerson, getFullName, validatePerson } from "./src/models/person.js";
import {
  fillNewPersonForm,
  openCreatePersonForm,
  searchByAddress,
  searchByName,
  searchByPhone
} from "./src/petpoint/petpointService.js";
import { clearPerson, loadPerson, savePerson } from "./src/storage/personStorage.js";
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
  renderWorkflow();
}

function renderWorkflow() {
  if (findPersonWorkflow.stage === WorkflowStage.CREATE_PERSON) {
    workflowStepElement.textContent = "Create New Person";
    runSearchButton.textContent = "Fill Person Form";
    runSearchButton.disabled = false;
    continueSearchButton.disabled = true;
    fillNewPersonButton.hidden = true;
    matchReviewActionsElement.hidden = true;
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
  matchReviewActionsElement.hidden = findPersonWorkflow.currentStep !== FindPersonStep.REVIEW;
}

async function loadSavedPerson() {
  const person = await loadPerson();
  displayPerson(person);
}

loadWaitwhilePersonButton.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url?.includes(".waitwhile.com/")) {
      throw new Error("Open the guest details in Waitwhile, then click this button.");
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

  displayPerson(null);
  statusElement.textContent = "Person cleared.";
});

loadSavedPerson().catch((error) => {
  console.error(error);
  statusElement.textContent = "Unable to load saved person.";
});
