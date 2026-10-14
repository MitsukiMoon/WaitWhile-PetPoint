import assert from "node:assert/strict";
import { chooseAddressCandidate, normalizeProviderResponse } from "./raskcService.js";

const candidate = chooseAddressCandidate([
  { score: 72, location: { x: 1, y: 2 } },
  { score: 100, location: { x: -122.25, y: 47.4 } }
]);
assert.equal(candidate.score, 100);
assert.throws(() => chooseAddressCandidate([{ score: 60, location: { x: 1, y: 2 } }]), /confidently locate/);

const raskc = normalizeProviderResponse([{
  Agency: "Regional Animal Services of King County (RASKC)",
  CityName: "Kent",
  Weblink_ePet: "licensepet.com/kingcountywa"
}]);
assert.equal(raskc.isRaskc, true);
assert.equal(raskc.city, "Kent");
assert.equal(raskc.website, "https://licensepet.com/kingcountywa");

const outside = normalizeProviderResponse([]);
assert.equal(outside.outsideKingCounty, true);

console.log("RASKC service tests passed.");
