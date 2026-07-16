export const FindPersonStep = Object.freeze({
  NAME: "name",
  PHONE: "phone",
  ADDRESS: "address",
  REVIEW: "review"
});

export const WorkflowStage = Object.freeze({
  FIND_PERSON: "find-person",
  CREATE_PERSON: "create-person",
  COMPLETE: "complete"
});

export function createFindPersonWorkflow() {
  return {
    stage: WorkflowStage.FIND_PERSON,
    currentStep: FindPersonStep.NAME,
    completedSteps: [],
    createStep: null
  };
}

export function advanceFindPersonWorkflow(workflow) {
  const nextStep = {
    [FindPersonStep.NAME]: FindPersonStep.PHONE,
    [FindPersonStep.PHONE]: FindPersonStep.ADDRESS,
    [FindPersonStep.ADDRESS]: FindPersonStep.REVIEW,
    [FindPersonStep.REVIEW]: FindPersonStep.REVIEW
  }[workflow.currentStep];

  return {
    ...workflow,
    currentStep: nextStep,
    completedSteps: [...workflow.completedSteps, workflow.currentStep]
  };
}

export function beginCreatePerson(workflow) {
  return {
    ...workflow,
    stage: WorkflowStage.CREATE_PERSON,
    createStep: "basic-information"
  };
}
