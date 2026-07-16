export function createPerson({
  id = null,
  waitwhileId = null,
  petPointId = null,
  firstName = "",
  lastName = "",
  phone = "",
  email = "",
  address1 = "",
  address2 = "",
  city = "",
  state = "",
  postalCode = "",
  notes = "",
} = {}) {
  return {
    id,
    waitwhileId,
    petPointId,
    firstName,
    lastName,
    phone,
    email,
    address1,
    address2,
    city,
    state,
    postalCode,
    notes,
  };
}

export function getFullName(person) {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function hasPhone(person) {
  return person.phone.length > 0;
}

export function hasAddress(person) {
  return person.address1.length > 0;
}

export function validatePerson(person) {
  const errors = [];

  if (!person.firstName) errors.push("Missing first name");
  if (!person.lastName) errors.push("Missing last name");
  if (!person.phone) errors.push("Missing phone");

  return errors;
}
