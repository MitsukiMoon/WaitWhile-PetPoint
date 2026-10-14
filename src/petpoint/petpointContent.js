console.log("Waitwhile → PetPoint content script loaded:", window.location.href);

const PETPOINT_HELPER_VERSION = "raskc-stability-v12";

function waitForElement(selector, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);

    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);

      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timed out waiting for ${selector}`));
    }, timeoutMs);
  });
}

function simulateClick(element) {
  for (const type of ["mousedown", "mouseup", "click"]) {
    element.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  }
}

function resolveElement(target) {
  if (!target) {
    return null;
  }

  if (typeof target === "string") {
    return document.querySelector(target);
  }

  return target;
}

function setTextInput(target, value) {
  if (!value) {
    return {
      field: target,
      status: "skipped"
    };
  }

  const input = resolveElement(target);

  if (!input) {
    return {
      field: target,
      status: "missing"
    };
  }

  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!valueSetter) {
    throw new Error(`Unable to access the value setter for ${target}`);
  }

  input.focus();
  valueSetter.call(input, value);

  for (const eventName of ["input", "change", "blur"]) {
    input.dispatchEvent(
      new Event(eventName, {
        bubbles: true
      })
    );
  }

  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      key: "Enter"
    })
  );

  input.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );

  input.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );

  return {
    field: target,
    status: "filled"
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeContactValue(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9@.]/g, "");
}

function findContactRow(containerSelector, inputSelector, contactValue) {
  const expected = normalizeContactValue(contactValue);
  const rows = Array.from(
    document.querySelectorAll(`${containerSelector} .k-listview-item`)
  );

  return rows.find((row) => {
    const input = row.querySelector(inputSelector);
    return normalizeContactValue(input?.value) === expected;
  }) || null;
}

async function markPrimaryContact(
  containerSelector,
  inputSelector,
  radioSelector,
  contactValue
) {
  // PetPoint re-renders contact rows after their value changes. Repeat the
  // selection against the current node so a later render cannot undo it.
  for (const waitMs of [150, 350, 700]) {
    await delay(waitMs);

    const row = findContactRow(containerSelector, inputSelector, contactValue);
    const primaryRadio = row?.querySelector(radioSelector);

    if (!primaryRadio) {
      continue;
    }

    if (!primaryRadio.checked) {
      const label = row.querySelector(`label[for='${primaryRadio.id}']`);
      (label || primaryRadio).click();
    }

    if (!primaryRadio.checked) {
      primaryRadio.click();
    }
  }

  const finalRow = findContactRow(containerSelector, inputSelector, contactValue);
  const selectedRadio = finalRow?.querySelector(radioSelector);

  return selectedRadio?.checked ? "selected" : "not-selected";
}

async function refreshContactCollection(addSelector, containerSelector, inputSelector) {
  const container = document.querySelector(containerSelector);
  const addButton = document.querySelector(addSelector);

  if (!container || !addButton) {
    return false;
  }

  const getRows = () => Array.from(
    document.querySelectorAll(`${containerSelector} .k-listview-item`)
  );
  const originalCount = getRows().length;

  simulateClick(addButton);

  try {
    await waitForMatchingElement(() => {
      const rows = getRows();
      return rows.length > originalCount ? rows.at(-1) : null;
    });

    const rows = getRows();
    const temporaryRow = rows.find((row) => {
      const input = row.querySelector(inputSelector);
      return input && !normalizeContactValue(input.value);
    });
    const deleteButton = temporaryRow?.querySelector(".delete-button, [data-bind*='remove']");

    if (!deleteButton) {
      return false;
    }

    simulateClick(deleteButton);
    await waitForMatchingElement(() => getRows().length === originalCount ? container : null);
    return true;
  } catch (_error) {
    return false;
  }
}

function setSearchValue(value) {
  const input = document.querySelector("#quickSearch");

  if (!input) {
    throw new Error("PetPoint quick-search input was not found.");
  }

  input.focus();
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  setter?.call(input, value);

  input.dispatchEvent(
    new Event("input", {
      bubbles: true
    })
  );

  input.dispatchEvent(
    new Event("change", {
      bubbles: true
    })
  );
}

function findAddressField(container, fieldName) {
  const selectors = {
    street: [
      "#Street0",
      "input[id$='Street0']",
      "input[id*='Street']",
      "input[name*='Street']",
      "input[aria-label*='Street']",
      "input[placeholder*='Street']",
      "input[data-bind*='street']"
    ],
    city: [
      "#City0",
      "input[id$='City0']",
      "input[id*='City']",
      "input[name*='City']",
      "input[aria-label*='City']",
      "input[placeholder*='City']"
    ],
    state: [
      "#State0",
      "input[id$='State0']",
      "input[id*='State']",
      "input[name*='State']",
      "input[aria-label*='State']",
      "input[placeholder*='State']"
    ],
    postalCode: [
      "#Postal0",
      "input[id$='Postal0']",
      "input[id*='Postal']",
      "input[id*='Zip']",
      "input[name*='Postal']",
      "input[name*='Zip']",
      "input[aria-label*='Postal']",
      "input[placeholder*='Postal']"
    ]
  };

  const candidates = selectors[fieldName] || [];

  for (const selector of candidates) {
    const match = container?.querySelector(selector);
    if (match) {
      return match;
    }
  }

  if (!container) {
    return null;
  }

  const inputs = Array.from(container.querySelectorAll("input, textarea"));

  const fallback = inputs.find((input) => {
    const text = [
      input.id,
      input.name,
      input.placeholder,
      input.getAttribute("aria-label"),
      input.getAttribute("data-bind")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(fieldName.toLowerCase()) ||
      (fieldName === "street" && /street|address line|address1|address 1/.test(text));
  });

  return fallback || inputs[0] || null;
}

function fillBasicPersonInformation(person) {
  return [
    setTextInput("#firstName", person.firstName),
    setTextInput("#lastName", person.lastName)
  ];
}

async function fillEmail(person) {
  if (!person.email) {
    return { field: "email", status: "skipped" };
  }

  const addButton = document.querySelector("#AddNewEmail");

  if (!addButton) {
    return { field: "email", status: "missing-add-button" };
  }

  simulateClick(addButton);

  const container = document.querySelector("#EmailListView");
  const input = container?.querySelector("#EMailAddress0, input[id$='EmailAddress0'], input[type='text']") ?? await waitForElement('#EmailListView input');
  const result = setTextInput(input, person.email);

  if (result.status === "filled") {
    const focusTarget = container?.querySelector("#EMailAddress0, input[id$='EmailAddress0']") ?? input;
    setTextInput(focusTarget, person.email);
    focusTarget.blur();
    await refreshContactCollection(
      "#AddNewEmail",
      "#EmailListView",
      "input[id^='EMailAddress']"
    );
    await markPrimaryContact(
      "#EmailListView",
      "input[id^='EMailAddress']",
      "input[type='radio'][name='PrimaryEmailRadio'], input[id^='PrimaryEmail']",
      person.email
    );
  }

  return {
    field: "email",
    status: result.status
  };
}

async function fillPhone(person) {
  if (!person.phone) {
    return { field: "phone", status: "skipped" };
  }

  const addButton = document.querySelector("#AddNewPhone");

  if (!addButton) {
    return { field: "phone", status: "missing-add-button" };
  }

  simulateClick(addButton);

  const container = document.querySelector("#PhoneNumberListView");
  const input = container?.querySelector("#PhoneNumber0, input[id$='PhoneNumber0'], input[type='text']") ?? await waitForElement('#PhoneNumberListView input');
  const result = setTextInput(input, person.phone);

  if (result.status === "filled") {
    const focusTarget = container?.querySelector("#PhoneNumber0, input[id$='PhoneNumber0']") ?? input;
    setTextInput(focusTarget, person.phone);
    focusTarget.blur();
    await refreshContactCollection(
      "#AddNewPhone",
      "#PhoneNumberListView",
      "input[id^='PhoneNumber']"
    );
    await markPrimaryContact(
      "#PhoneNumberListView",
      "input[id^='PhoneNumber']",
      "input[type='radio'][name='PrimaryPhoneRadio'], input[id^='PrimaryPhone']",
      person.phone
    );
  }

  return {
    field: "phone",
    status: result.status
  };
}

async function fillAddress(person) {
  if (!person.address1) {
    return { field: "address", status: "skipped" };
  }

  const addButton = document.querySelector("#AddNewAddress");

  if (!addButton) {
    return { field: "address", status: "missing-add-button" };
  }

  simulateClick(addButton);

  const container = document.querySelector("#PDEAddressListView");
  await waitForElement("#PDEAddressListView input, #PDEAddressListView textarea");

  const address1 = findAddressField(container, "street");
  const city = findAddressField(container, "city");
  const state = findAddressField(container, "state");
  const postalCode = findAddressField(container, "postalCode");

  const results = [
    setTextInput(address1, person.address1),
    setTextInput(city, person.city),
    setTextInput(state, person.state),
    setTextInput(postalCode, person.postalCode)
  ];

  const filledCount = results.filter((result) => result.status === "filled").length;

  return {
    field: "address",
    status: filledCount > 0 ? "filled" : "missing"
  };
}

async function fillCompletePersonForm(person) {
  const results = [];

  results.push(...fillBasicPersonInformation(person));
  results.push(await fillEmail(person));
  results.push(await fillPhone(person));
  results.push(await fillAddress(person));

  return results;
}

function waitForMatchingElement(findElement, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const existing = findElement();
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = findElement();
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out waiting for the requested PetPoint option."));
    }, timeoutMs);
  });
}

function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function getRaskcDates(now = new Date()) {
  const issued = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expires = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { issued: formatDate(issued), expires: formatDate(expires) };
}

async function selectPetIdType(typeName) {
  const input = await waitForElement("#PetIDType");
  const picker = input.closest(".k-picker") || input.parentElement;
  if (!picker) throw new Error("The PetPoint Pet ID Type control was not found.");

  const trigger = picker.querySelector('[role="button"]') || picker;
  simulateClick(trigger);
  const listboxId = picker.getAttribute("aria-controls") || "PetIDType_listbox";
  const option = await waitForMatchingElement(() => {
    const listbox = document.getElementById(listboxId);
    return [...(listbox?.querySelectorAll('[role="option"], li') ?? [])]
      .find((item) => item.textContent.trim().toUpperCase() === typeName.toUpperCase());
  }).catch(() => null);
  if (!option) throw new Error(`The ${typeName} option did not load in PetPoint. Close the Pet ID modal and try again.`);
  simulateClick(option);
  await delay(400);
}

async function fillRaskcPetIdForm(tagId) {
  if (!document.querySelector("#PetIDNumber")) {
    let addPetIdButton = document.querySelector("#AddAnimalPetID");
    const identificationPanel = document.querySelector("#identification");
    const identificationTab = document.querySelector(
      '#identification-tab, #identifications-tab, [role="tab"][aria-controls="identification"], a[href="#identification"]'
    ) || [...document.querySelectorAll('[role="tab"], a, button')].find((element) =>
      /^identifications?$/i.test(element.textContent.trim())
    );
    const identificationIsActive = (
      identificationPanel?.classList.contains("active") && identificationPanel?.classList.contains("show")
    ) || identificationTab?.getAttribute("aria-selected") === "true" || identificationTab?.classList.contains("active");

    if (!identificationIsActive) {
      if (!identificationTab) {
        throw new Error("The animal's Identifications tab was not found in PetPoint. Open an animal profile and try again.");
      }

      simulateClick(identificationTab);
      // PetPoint loads this tab asynchronously. Clicking Add before its data
      // finishes binding can produce an intermittent server error.
      await delay(800);
    }

    if (!addPetIdButton || addPetIdButton.offsetParent === null) {
      addPetIdButton = await waitForMatchingElement(() => {
        const button = document.querySelector("#AddAnimalPetID");
        return button?.offsetParent !== null ? button : null;
      }, 10000);
    }

    await delay(350);
    simulateClick(addPetIdButton);
    await waitForElement("#PetIDNumber");
    await delay(600);
  }

  const { issued, expires } = getRaskcDates();
  await selectPetIdType("RASKC Tag");

  const fields = [
    ["input#PetIDNumber", tagId],
    ["input#PetIDIssuer", "SH"],
    ["input#PetIDIssuerPhone", "4256410080"],
    ["input#PetIDIssued", issued],
    ["input#PetIDExpires", expires]
  ];
  const results = [];

  for (const [selector, value] of fields) {
    results.push(setTextInput(selector, value));
    await delay(200);
  }
  const missing = results.filter((result) => result.status === "missing");
  if (missing.length) throw new Error("One or more PetPoint Pet ID fields were not found.");

  return {
    success: true,
    message: `RASKC tag ${tagId} filled. Issued ${issued}; expires ${expires}. Review and save in PetPoint.`
  };
}

async function openCreatePersonForm() {
  const addButton = document.querySelector("#navbarAddItem");
  let personButton;

  if (addButton) {
    simulateClick(addButton);
    personButton = await waitForElement('#globalOperations a[data-type="Person"], #globalOperations [data-type="Person"]');
  } else {
    const quickSearch = document.querySelector("#quickSearch");
    if (!quickSearch) {
      throw new Error("Neither the PetPoint Add button nor search bar was found.");
    }

    simulateClick(quickSearch);
    quickSearch.focus();

    personButton = await waitForMatchingElement(() => {
      const attributedAction = [...document.querySelectorAll(
        '#quickSearch_listbox [data-type="Person"], #searchArea [data-type="Person"], #globalOperations [data-type="Person"]'
      )].find((element) => element.offsetParent !== null);
      if (attributedAction) return attributedAction;

      const personsHeader = [...document.querySelectorAll("#quickSearch_listbox .QSHeader")]
        .find((header) => header.offsetParent !== null && /^persons?$/i.test(
          header.querySelector("h4")?.textContent.trim() ?? ""
        ));
      if (personsHeader) return personsHeader;

      return [...document.querySelectorAll(
        '#quickSearch_listbox button, #quickSearch_listbox a, #searchArea button, #searchArea a, #globalOperations button, #globalOperations a'
      )].find((element) => element.offsetParent !== null && /^persons?$/i.test(element.textContent.trim()));
    }).catch(() => null);

    if (!personButton) {
      throw new Error("The Person action did not appear from the PetPoint search bar.");
    }
  }

  simulateClick(personButton);

  await waitForElement("#firstName");

  return {
    success: true,
    message: "Create Person form opened."
  };
}

function findVaccineExpressLink() {
  return [...document.querySelectorAll("a.report-link")].find((link) => {
    const reportUrl = link.getAttribute("report-url") || "";
    const label = link.textContent.replace(/\s+/g, " ").trim();
    return reportUrl.includes("SSRSID=MedicalVaccineExpress") ||
      label === "Medical: Vaccine Express";
  }) || null;
}

async function selectVaccineExpress() {
  const vaccineExpressLink = await waitForMatchingElement(findVaccineExpressLink, 10000);

  await chrome.storage.local.set({
    rabiesWorkflowStep: {
      step: "configure-vaccine-express",
      startedAt: Date.now()
    }
  });
  setTimeout(() => simulateClick(vaccineExpressLink), 75);

  return {
    success: true,
    message: "Opening Medical: Vaccine Express."
  };
}

async function selectKendoOption(inputSelector, optionText) {
  const input = await waitForElement(inputSelector, 10000);
  const dropdown = input.closest(".k-dropdown") || input.parentElement;

  if (!dropdown) {
    throw new Error(`The ${inputSelector} dropdown was not found.`);
  }

  simulateClick(dropdown.querySelector(".k-dropdown-wrap") || dropdown);

  const option = await waitForMatchingElement(() => {
    return [...document.querySelectorAll(`${inputSelector}_listbox li`)].find((item) => {
      return item.offsetParent !== null &&
        item.textContent.replace(/\s+/g, " ").trim() === optionText;
    });
  }, 5000);

  simulateClick(option);
}

function formatReportDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} 12:00 AM`;
}

async function configureVaccineExpressReport() {
  await waitForElement("#AnimalStatus", 10000);

  await selectKendoOption("#AnimalStatus", "Active");
  await selectKendoOption("#BasedOn", "Record Created Date");
  await selectKendoOption("#BasedOnStatus", "Completed");

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  setTextInput("#BasedOnDateFrom", formatReportDate(weekAgo));

  await selectKendoOption("#AnimalTagType", "Rabies Tag");
  await selectKendoOption("#With_WithoutOption", "Animal Without above Tag");

  await chrome.storage.local.remove("rabiesWorkflowStep");
  await chrome.storage.local.set({ rabiesWorkflowConfiguredAt: Date.now() });

  return {
    success: true,
    message: "Vaccine Express is configured for active animals without a Rabies Tag. Review before running the report."
  };
}

async function openRabiesReportWebsite() {
  if (document.querySelector("#AnimalStatus") && document.querySelector("#BasedOn")) {
    return configureVaccineExpressReport();
  }

  if (findVaccineExpressLink()) {
    return selectVaccineExpress();
  }

  const reportsToggle = document.querySelector("#ReportsNavbarDropdown");

  if (!reportsToggle) {
    throw new Error("The PetPoint Reports menu was not found.");
  }

  simulateClick(reportsToggle);

  const reportWebsiteLink = await waitForMatchingElement(() => {
    return [...document.querySelectorAll(".dropdown-menu a[href*='ExternalReportApp.aspx']")]
      .find((link) => link.offsetParent !== null);
  });

  // Navigate in the current tab so the workflow is not blocked by the
  // browser's popup protection for PetPoint's target=_blank link.
  await chrome.storage.local.set({
    rabiesWorkflowStep: {
      step: "open-vaccine-express",
      startedAt: Date.now()
    }
  });

  setTimeout(() => {
    window.location.assign(reportWebsiteLink.href);
  }, 75);

  return {
    success: true,
    message: "Opening Report Website, then Medical: Vaccine Express."
  };
}

async function continueRabiesWorkflow() {
  const { rabiesWorkflowStep } = await chrome.storage.local.get("rabiesWorkflowStep");

  if (!rabiesWorkflowStep?.step) {
    return;
  }

  if (Date.now() - Number(rabiesWorkflowStep.startedAt || 0) > 120000) {
    await chrome.storage.local.remove("rabiesWorkflowStep");
    return;
  }

  try {
    if (rabiesWorkflowStep.step === "open-vaccine-express") {
      await selectVaccineExpress();
    } else if (rabiesWorkflowStep.step === "configure-vaccine-express") {
      await configureVaccineExpressReport();
    }
  } catch (error) {
    console.error("Unable to continue to Vaccine Express:", error);
    await chrome.storage.local.remove("rabiesWorkflowStep");
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PETPOINT_PING") {
    sendResponse({ success: true, version: PETPOINT_HELPER_VERSION });
    return false;
  }

  if (message.type === "PETPOINT_FILL_RASKC_ID") {
    fillRaskcPetIdForm(message.tagId)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unable to fill the RASKC Pet ID form."
      }));
    return true;
  }

  if (message.type === "PETPOINT_OPEN_RABIES_REPORTS") {
    openRabiesReportWebsite()
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unable to open the PetPoint Report Website."
      }));
    return true;
  }

  if (message.type === "PETPOINT_SEARCH") {
    try {
      setSearchValue(message.query);

      sendResponse({
        success: true,
        message: `Searching PetPoint for: ${message.query}`
      });
    } catch (error) {
      sendResponse({
        success: false,
        message: error.message
      });
    }

    return true;
  }

  if (message.type === "PETPOINT_OPEN_CREATE_PERSON") {
    openCreatePersonForm()
      .then((response) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          success: false,
          message: error.message
        });
      });

    return true;
  }

  if (message.type !== "PETPOINT_FILL_PERSON_FORM") {
    return false;
  }

  (async () => {
    try {
      const results = await fillCompletePersonForm(message.person);
      const filledCount = results.filter((result) => result.status === "filled").length;
      const missingFields = results.filter((result) => result.status === "missing").map((result) => result.field);

      sendResponse({
        success: missingFields.length === 0,
        results,
        message: missingFields.length === 0
          ? `${filledCount} fields filled. Review before saving.`
          : `Some fields were not found: ${missingFields.join(", ")}`
      });
    } catch (error) {
      console.error("Unable to fill PetPoint person form:", error);

      sendResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unable to fill the PetPoint form."
      });
    }
  })();

  return true;
});

continueRabiesWorkflow();
