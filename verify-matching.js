import { calculateMatchScore, classifyMatch } from './src/shared/matching.js';

const waitwhilePerson = {
  firstName: 'Sarah',
  lastName: 'Kim',
  phone: '(425) 555-1234',
  address1: '123 Main Street',
  postalCode: '98004',
};

const exactMatch = {
  firstName: 'Sarah',
  lastName: 'Kim',
  phone: '4255551234',
  address1: '123 Main St',
  postalCode: '98004',
};

const likelyMatch = {
  firstName: 'Sarah',
  lastName: 'Kim',
  phone: '4255551234',
  address1: '800 Lake Street',
  postalCode: '98005',
};

const possibleMatch = {
  firstName: 'David',
  lastName: 'Kim',
  phone: '4255551234',
  address1: '800 Lake Street',
  postalCode: '98005',
};

const cases = [
  { label: 'exact', person: exactMatch },
  { label: 'likely', person: likelyMatch },
  { label: 'possible', person: possibleMatch },
];

for (const testCase of cases) {
  const score = calculateMatchScore(waitwhilePerson, testCase.person);
  const confidence = classifyMatch(score);
  console.log(`${testCase.label}: score=${score} confidence=${confidence}`);
}
