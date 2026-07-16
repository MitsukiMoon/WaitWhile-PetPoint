import {
  normalizeAddress,
  normalizeName,
  normalizePhone,
  normalizePostalCode,
} from "./normalize.js";

export function calculateMatchScore(waitwhilePerson, petPointPerson) {
  let score = 0;

  const samePhone =
    normalizePhone(waitwhilePerson.phone) !== "" &&
    normalizePhone(waitwhilePerson.phone) ===
      normalizePhone(petPointPerson.phone);

  const sameAddress =
    normalizeAddress(waitwhilePerson.address1) !== "" &&
    normalizeAddress(waitwhilePerson.address1) ===
      normalizeAddress(petPointPerson.address1);

  const samePostalCode =
    normalizePostalCode(waitwhilePerson.postalCode) !== "" &&
    normalizePostalCode(waitwhilePerson.postalCode) ===
      normalizePostalCode(petPointPerson.postalCode);

  const sameFirstName =
    normalizeName(waitwhilePerson.firstName) !== "" &&
    normalizeName(waitwhilePerson.firstName) ===
      normalizeName(petPointPerson.firstName);

  const sameLastName =
    normalizeName(waitwhilePerson.lastName) !== "" &&
    normalizeName(waitwhilePerson.lastName) ===
      normalizeName(petPointPerson.lastName);

  if (samePhone) score += 50;
  if (sameAddress) score += 25;
  if (samePostalCode) score += 10;
  if (sameFirstName) score += 5;
  if (sameLastName) score += 10;

  return score;
}

export function classifyMatch(score) {
  if (score >= 90) return "exact";
  if (score >= 70) return "likely";
  if (score >= 50) return "possible";
  return "none";
}
