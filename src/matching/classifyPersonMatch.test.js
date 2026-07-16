import {
  classifyPersonMatch,
  MatchType
} from "./classifyPersonMatch.js";

const waitwhilePerson = {
  firstName: "Sarah",
  lastName: "Kim",
  phone: "(425) 555-1234",
  address1: "123 Main Street",
  postalCode: "98004"
};

const samePerson = {
  firstName: "Sarah",
  lastName: "Kim",
  phone: "4255551234",
  address1: "123 Main St.",
  postalCode: "98004-1234"
};

const sameHousehold = {
  firstName: "David",
  lastName: "Kim",
  phone: "425-555-1234",
  address1: "123 Main Street",
  postalCode: "98004"
};

const possiblePerson = {
  firstName: "Sarah",
  lastName: "Kim",
  phone: "4255551234",
  address1: "999 Other Road",
  postalCode: "98101"
};

const phoneOnly = {
  firstName: "Alex",
  lastName: "Lee",
  phone: "4255551234",
  address1: "500 Pine Street",
  postalCode: "98101"
};

const noMatch = {
  firstName: "Maria",
  lastName: "Garcia",
  phone: "2065559999",
  address1: "500 Pine Street",
  postalCode: "98101"
};

console.assert(
  classifyPersonMatch(waitwhilePerson, samePerson).type ===
    MatchType.SAME_PERSON,
  "Same-person classification failed"
);

console.assert(
  classifyPersonMatch(waitwhilePerson, sameHousehold).type ===
    MatchType.SAME_HOUSEHOLD,
  "Same-household classification failed"
);

console.assert(
  classifyPersonMatch(waitwhilePerson, possiblePerson).type ===
    MatchType.POSSIBLE_PERSON,
  "Possible-person classification failed"
);

console.assert(
  classifyPersonMatch(waitwhilePerson, phoneOnly).type ===
    MatchType.PHONE_ONLY,
  "Phone-only classification failed"
);

console.assert(
  classifyPersonMatch(waitwhilePerson, noMatch).type ===
    MatchType.NO_MATCH,
  "No-match classification failed"
);

console.log("Person classification tests passed");
