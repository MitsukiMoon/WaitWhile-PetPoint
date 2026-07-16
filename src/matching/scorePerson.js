import {
  normalizeAddress,
  normalizeName,
  normalizePhone,
  normalizePostalCode
} from "./normalize.js";

export function scorePersonMatch(sourcePerson, candidatePerson) {
  let score = 0;
  const reasons = [];

  const sourcePhone = normalizePhone(sourcePerson.phone);
  const candidatePhone = normalizePhone(candidatePerson.phone);

  const sourceAddress = normalizeAddress(sourcePerson.address1);
  const candidateAddress = normalizeAddress(candidatePerson.address1);

  const sourceZip = normalizePostalCode(sourcePerson.postalCode);
  const candidateZip = normalizePostalCode(candidatePerson.postalCode);

  const sourceFirstName = normalizeName(sourcePerson.firstName);
  const candidateFirstName = normalizeName(candidatePerson.firstName);

  const sourceLastName = normalizeName(sourcePerson.lastName);
  const candidateLastName = normalizeName(candidatePerson.lastName);

  if (sourcePhone && sourcePhone === candidatePhone) {
    score += 50;
    reasons.push("Phone matches");
  }

  if (sourceAddress && sourceAddress === candidateAddress) {
    score += 25;
    reasons.push("Address matches");
  }

  if (sourceZip && sourceZip === candidateZip) {
    score += 10;
    reasons.push("ZIP code matches");
  }

  if (sourceFirstName && sourceFirstName === candidateFirstName) {
    score += 5;
    reasons.push("First name matches");
  }

  if (sourceLastName && sourceLastName === candidateLastName) {
    score += 10;
    reasons.push("Last name matches");
  }

  return {
    score,
    confidence: classifyMatch(score),
    reasons
  };
}

export function classifyMatch(score) {
  if (score >= 90) return "strong";
  if (score >= 70) return "likely";
  if (score >= 50) return "possible";
  return "none";
}
