export async function searchByName(person) {
  const query = `${person.firstName} ${person.lastName}`.trim();
  return searchPetPoint(query);
}

export async function searchByPhone(person) {
  return searchPetPoint(person.phone);
}

export async function searchByAddress(person) {
  const query = [person.address1, person.postalCode].filter(Boolean).join(" ");
  return searchPetPoint(query);
}

export async function fillNewPersonForm(person) {
  return sendPetPointMessage("PETPOINT_FILL_PERSON_FORM", {
    person
  });
}

export async function openCreatePersonForm() {
  return sendPetPointMessage("PETPOINT_OPEN_CREATE_PERSON");
}

export async function openVaccineExpress() {
  return sendPetPointMessage("PETPOINT_OPEN_RABIES_REPORTS");
}

export async function fillRaskcPetIdForm(tagId) {
  const helper = await sendPetPointMessage("PETPOINT_PING");
  if (helper.version !== "raskc-stability-v12") {
    throw new Error("The PetPoint tab is using an outdated helper. Refresh the PetPoint page, then try again.");
  }
  return sendPetPointMessage("PETPOINT_FILL_RASKC_ID", { tagId });
}

export const searchPetPointByName = searchByName;
export const searchPetPointByPhone = searchByPhone;
export const searchPetPointByAddress = searchByAddress;

async function searchPetPoint(query) {
  return sendPetPointMessage("PETPOINT_SEARCH", { query });
}

async function sendPetPointMessage(type, payload = {}) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error("No active tab was found.");
  }

  const isFakePetPoint = tab.url?.startsWith("http://localhost:3000/");
  const isRealPetPoint = tab.url?.startsWith("https://sms.petpoint.com/");

  if (!isFakePetPoint && !isRealPetPoint) {
    throw new Error(`Open the PetPoint page first. Current tab: ${tab.url ?? "unknown"}`);
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type,
      ...payload
    });

    if (response == null) {
      throw new Error("PetPoint is using an older version of the helper. Reload the extension, refresh the PetPoint tab, and try again.");
    }

    if (!response?.success) {
      throw new Error(response.message ?? `PetPoint could not complete ${type}. Reload the extension and refresh PetPoint if this action was recently added.`);
    }

    return response;
  } catch (error) {
    if (error.message?.includes("Receiving end does not exist")) {
      throw new Error("The PetPoint helper is not loaded on this tab. Reload the extension, refresh PetPoint, and try again.");
    }

    throw error;
  }
}
