export function normalizePhone(value = "") {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

export function normalizeName(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

export function normalizePostalCode(value = "") {
  return value.trim().slice(0, 5);
}

export function normalizeState(value = "") {
  return value.trim().toUpperCase();
}

export function normalizeAddress(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,#]/g, "")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\broad\b/g, "rd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\blane\b/g, "ln")
    .replace(/\bcourt\b/g, "ct")
    .replace(/\bapartment\b/g, "apt")
    .replace(/\bsuite\b/g, "ste")
    .replace(/\s+/g, " ");
}

export function normalizePerson(person) {
  return {
    ...person,
    firstName: normalizeName(person.firstName),
    lastName: normalizeName(person.lastName),
    phone: normalizePhone(person.phone),
    email: normalizeEmail(person.email),
    address1: normalizeAddress(person.address1),
    address2: normalizeAddress(person.address2),
    city: normalizeName(person.city),
    state: normalizeState(person.state),
    postalCode: normalizePostalCode(person.postalCode)
  };
}
