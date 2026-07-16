import assert from "node:assert/strict";
import {
  WorkflowStage,
  beginCreatePerson,
  createFindPersonWorkflow,
  FindPersonStep
} from "./findPersonWorkflow.js";

const workflow = createFindPersonWorkflow();
assert.equal(workflow.stage, WorkflowStage.FIND_PERSON);
assert.equal(workflow.currentStep, FindPersonStep.NAME);

const createWorkflow = beginCreatePerson(workflow);
assert.equal(createWorkflow.stage, WorkflowStage.CREATE_PERSON);
assert.equal(createWorkflow.createStep, "basic-information");

console.log("findPersonWorkflow tests passed");
