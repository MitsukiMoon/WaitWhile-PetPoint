export function normalizePhone(value = "") {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

export function normalizePostalCode(value = "") {
  return value.trim().slice(0, 5);
}

export function normalizeName(value = "") {
  return value.trim().toLowerCase();
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
    .replace(/\bapartment\b/g, "apt")
    .replace(/\s+/g, " ");
}
