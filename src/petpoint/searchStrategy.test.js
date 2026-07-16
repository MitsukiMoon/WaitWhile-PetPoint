import {
  SearchStep,
  advanceSearch,
  createSearchState,
  getSearchFields,
  getNextSearchStep
} from "./searchStrategy.js";

const person = {
  firstName: "Sarah",
  lastName: "Kim",
  phone: "4255551234",
  address1: "123 Main Street",
  postalCode: "98004"
};

const initialState = createSearchState();

console.assert(
  initialState.currentStep === SearchStep.NAME,
  "Search should begin with name"
);

console.assert(
  getNextSearchStep(SearchStep.NAME) === SearchStep.PHONE,
  "Name should advance to phone"
);

console.assert(
  getNextSearchStep(SearchStep.PHONE) === SearchStep.ADDRESS,
  "Phone should advance to address"
);

console.assert(
  getNextSearchStep(SearchStep.ADDRESS) === SearchStep.COMPLETE,
  "Address should advance to complete"
);

const nameFields = getSearchFields(SearchStep.NAME, person);

console.assert(
  nameFields.firstName === "Sarah" &&
    nameFields.lastName === "Kim",
  "Name fields failed"
);

const phoneFields = getSearchFields(SearchStep.PHONE, person);

console.assert(
  phoneFields.phone === "4255551234",
  "Phone fields failed"
);

const addressFields = getSearchFields(
  SearchStep.ADDRESS,
  person
);

console.assert(
  addressFields.address1 === "123 Main Street" &&
    addressFields.postalCode === "98004",
  "Address fields failed"
);

const afterName = advanceSearch(initialState, 4);

console.assert(
  afterName.currentStep === SearchStep.PHONE,
  "State did not advance to phone"
);

console.assert(
  afterName.completedSteps.includes(SearchStep.NAME),
  "Name step was not marked complete"
);

console.assert(
  afterName.candidateCount === 4,
  "Candidate count was not saved"
);

console.log("Search strategy tests passed");
