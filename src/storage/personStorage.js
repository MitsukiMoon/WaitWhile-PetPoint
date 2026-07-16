import { createPerson } from "../models/person.js";

const STORAGE_KEY = "pendingPerson";

export async function savePerson(person) {
  const normalizedPerson = createPerson(person);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalizedPerson });
  return normalizedPerson;
}

export async function loadPerson() {
  const { pendingPerson } = await chrome.storage.local.get(STORAGE_KEY);
  return pendingPerson ? createPerson(pendingPerson) : null;
}

export async function clearPerson() {
  await chrome.storage.local.remove(STORAGE_KEY);
}
