export const SearchStep = Object.freeze({
  NAME: "name",
  PHONE: "phone",
  ADDRESS: "address",
  COMPLETE: "complete"
});

export function createSearchState() {
  return {
    currentStep: SearchStep.NAME,
    completedSteps: [],
    candidateCount: null
  };
}

export function getSearchFields(step, person) {
  switch (step) {
    case SearchStep.NAME:
      return {
        firstName: person.firstName,
        lastName: person.lastName
      };

    case SearchStep.PHONE:
      return {
        phone: person.phone
      };

    case SearchStep.ADDRESS:
      return {
        address1: person.address1,
        postalCode: person.postalCode
      };

    case SearchStep.COMPLETE:
      return {};

    default:
      throw new Error(`Unknown search step: ${step}`);
  }
}

export function getNextSearchStep(currentStep) {
  switch (currentStep) {
    case SearchStep.NAME:
      return SearchStep.PHONE;

    case SearchStep.PHONE:
      return SearchStep.ADDRESS;

    case SearchStep.ADDRESS:
      return SearchStep.COMPLETE;

    case SearchStep.COMPLETE:
      return SearchStep.COMPLETE;

    default:
      throw new Error(`Unknown search step: ${currentStep}`);
  }
}

export function advanceSearch(state, candidateCount) {
  if (state.currentStep === SearchStep.COMPLETE) {
    return state;
  }

  return {
    currentStep: getNextSearchStep(state.currentStep),
    completedSteps: [...state.completedSteps, state.currentStep],
    candidateCount
  };
}
