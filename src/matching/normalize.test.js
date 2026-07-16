import {
  normalizeAddress,
  normalizeEmail,
  normalizePhone,
  normalizePostalCode
} from "./normalize.js";

console.assert(
  normalizePhone("(425) 555-1234") === "4255551234",
  "Phone normalization failed"
);

console.assert(
  normalizePhone("+1 425-555-1234") === "4255551234",
  "Country code removal failed"
);

console.assert(
  normalizeAddress("123 Main Street, Apt. #4") ===
    "123 main st apt 4",
  "Address normalization failed"
);

console.assert(
  normalizeEmail(" SARAH@EXAMPLE.COM ") ===
    "sarah@example.com",
  "Email normalization failed"
);

console.assert(
  normalizePostalCode("98004-1234") === "98004",
  "ZIP normalization failed"
);

console.log("All normalization tests passed.");
