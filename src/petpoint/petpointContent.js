console.log("Waitwhile → PetPoint content script loaded:", window.location.href);

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

async function openCreatePersonForm() {
  const addButton = document.querySelector("#navbarAddItem");

  if (!addButton) {
    throw new Error("PetPoint Add button was not found.");
  }

  simulateClick(addButton);

  const personButton = await waitForElement('#globalOperations a[data-type="Person"]');
  simulateClick(personButton);

  await waitForElement("#firstName");

  return {
    success: true,
    message: "Create Person form opened."
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
