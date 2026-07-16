console.log("Waitwhile to PetPoint extractor loaded:", window.location.href);

function getDisplayValue(element) {
  return element?.innerText?.replace(/\s+/g, " ").trim() ?? "";
}

function readVisitDetails() {
  const details = {};
  const groups = document.querySelectorAll("ww-display-object");

  for (const group of groups) {
    const children = Array.from(group.children);

    for (let index = 0; index < children.length - 1; index += 1) {
      const keyElement = children[index];
      const valueElement = children[index + 1];

      if (keyElement.tagName !== "WW-DISPLAY-OBJECT-KEY" ||
          valueElement.tagName !== "WW-DISPLAY-OBJECT-VALUE") {
        continue;
      }

      const key = getDisplayValue(keyElement).toLowerCase();
      const value = getDisplayValue(valueElement);

      if (key && value && value.toLowerCase() !== "add") {
        details[key] = value;
      }
    }
  }

  return details;
}

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1)
  };
}

function extractPerson() {
  const details = readVisitDetails();
  const name = splitName(details.name);

  return {
    ...name,
    phone: details.phone ?? "",
    email: details.email ?? "",
    address1: details.address ?? details["address 1"] ?? details.street ?? "",
    address2: details["address 2"] ?? "",
    city: details.city ?? "",
    state: details.state ?? "",
    postalCode: details["postal code"] ?? details.zip ?? details["zip code"] ?? "",
    waitwhileId: details.id ?? null,
    notes: details.notes ?? ""
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "WAITWHILE_EXTRACT_PERSON") {
    return false;
  }

  const person = extractPerson();

  if (!person.firstName && !person.phone && !person.email) {
    sendResponse({
      success: false,
      message: "No open Waitwhile visit details were found. Open a guest's details and try again."
    });
    return false;
  }

  sendResponse({ success: true, person });
  return false;
});
