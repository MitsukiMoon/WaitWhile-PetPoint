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

    if (!response?.success) {
      throw new Error(response?.message ?? "PetPoint action failed.");
    }

    return response;
  } catch (error) {
    if (error.message?.includes("Receiving end does not exist")) {
      throw new Error("The PetPoint helper is not loaded on this tab. Reload the extension, refresh PetPoint, and try again.");
    }

    throw error;
  }
}
