import {
  normalizeAddress,
  normalizeName,
  normalizePhone,
  normalizePostalCode
} from "./normalize.js";

export const MatchType = Object.freeze({
  SAME_PERSON: "same-person",
  SAME_HOUSEHOLD: "same-household",
  PHONE_ONLY: "phone-only",
  POSSIBLE_PERSON: "possible-person",
  NO_MATCH: "no-match"
});

export function classifyPersonMatch(sourcePerson, candidatePerson) {
  const phoneMatches =
    hasValue(sourcePerson.phone) &&
    normalizePhone(sourcePerson.phone) === normalizePhone(candidatePerson.phone);

  const addressMatches =
    hasValue(sourcePerson.address1) &&
    normalizeAddress(sourcePerson.address1) === normalizeAddress(candidatePerson.address1);

  const postalCodeMatches =
    hasValue(sourcePerson.postalCode) &&
    normalizePostalCode(sourcePerson.postalCode) === normalizePostalCode(candidatePerson.postalCode);

  const firstNameMatches =
    hasValue(sourcePerson.firstName) &&
    normalizeName(sourcePerson.firstName) === normalizeName(candidatePerson.firstName);

  const lastNameMatches =
    hasValue(sourcePerson.lastName) &&
    normalizeName(sourcePerson.lastName) === normalizeName(candidatePerson.lastName);

  const fullNameMatches = firstNameMatches && lastNameMatches;
  const householdMatches = addressMatches && postalCodeMatches;

  if (phoneMatches && fullNameMatches && householdMatches) {
    return createResult(
      MatchType.SAME_PERSON,
      "strong",
      [
        "Phone matches",
        "Full name matches",
        "Address matches",
        "ZIP code matches"
      ]
    );
  }

  if (phoneMatches && householdMatches && !fullNameMatches) {
    return createResult(
      MatchType.SAME_HOUSEHOLD,
      "strong",
      [
        "Phone matches",
        "Address matches",
        "ZIP code matches",
        "Name differs"
      ]
    );
  }

  if (phoneMatches && fullNameMatches) {
    return createResult(
      MatchType.POSSIBLE_PERSON,
      "likely",
      [
        "Phone matches",
        "Full name matches",
        "Address does not match"
      ]
    );
  }

  if (phoneMatches) {
    return createResult(MatchType.PHONE_ONLY, "possible", ["Phone matches"]);
  }

  return createResult(MatchType.NO_MATCH, "none", []);
}

function hasValue(value) {
  return typeof value === "string" && value.trim() !== "";
}

function createResult(type, confidence, reasons) {
  return {
    type,
    confidence,
    reasons
  };
}
