import { scorePersonMatch } from "./scorePerson.js";

const waitwhilePerson = {
  firstName: "Sarah",
  lastName: "Kim",
  phone: "(425) 555-1234",
  address1: "123 Main Street",
  city: "Bellevue",
  state: "WA",
  postalCode: "98004"
};

const exactCandidate = {
  firstName: "Sarah",
  lastName: "Kim",
  phone: "4255551234",
  address1: "123 Main St.",
  city: "Bellevue",
  state: "WA",
  postalCode: "98004-1234"
};

const householdCandidate = {
  firstName: "David",
  lastName: "Kim",
  phone: "425-555-1234",
  address1: "123 Main Street",
  city: "Bellevue",
  state: "WA",
  postalCode: "98004"
};

const phoneOnlyCandidate = {
  firstName: "Alex",
  lastName: "Lee",
  phone: "4255551234",
  address1: "999 Other Road",
  city: "Seattle",
  state: "WA",
  postalCode: "98101"
};

const noMatchCandidate = {
  firstName: "Maria",
  lastName: "Garcia",
  phone: "2065559999",
  address1: "500 Pine Street",
  city: "Seattle",
  state: "WA",
  postalCode: "98101"
};

const exactResult = scorePersonMatch(waitwhilePerson, exactCandidate);
console.assert(exactResult.score === 100, "Exact score failed");
console.assert(exactResult.confidence === "strong", "Exact confidence failed");

const householdResult = scorePersonMatch(waitwhilePerson, householdCandidate);
console.assert(householdResult.score === 95, "Household score failed");
console.assert(householdResult.confidence === "strong", "Household confidence failed");

const phoneOnlyResult = scorePersonMatch(waitwhilePerson, phoneOnlyCandidate);
console.assert(phoneOnlyResult.score === 50, "Phone-only score failed");
console.assert(phoneOnlyResult.confidence === "possible", "Phone-only confidence failed");

const noMatchResult = scorePersonMatch(waitwhilePerson, noMatchCandidate);
console.assert(noMatchResult.score === 0, "No-match score failed");
console.assert(noMatchResult.confidence === "none", "No-match confidence failed");

console.log("All person matching tests passed.");
