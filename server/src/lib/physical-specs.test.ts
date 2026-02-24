import test from "node:test";
import assert from "node:assert/strict";

import { getPhysicalSpec, physicalSpecsV1 } from "./physical-specs";

function zonesAreWithinBounds(product: ReturnType<typeof getPhysicalSpec>): void {
  for (const zone of [...product.zones.printSafe, ...product.zones.blocked]) {
    assert.ok(zone.xMm + zone.widthMm <= product.physical.widthMm, `${product.type}.${zone.id} exceeds width`);
    assert.ok(zone.yMm + zone.heightMm <= product.physical.heightMm, `${product.type}.${zone.id} exceeds height`);
  }
}

test("physical specs are versioned", () => {
  assert.equal(physicalSpecsV1.version, "v1");
  assert.equal(physicalSpecsV1.units, "mm");
});

test("tag and card dimensions are fixed", () => {
  const tag = getPhysicalSpec("tag");
  const card = getPhysicalSpec("card");

  assert.deepEqual(tag.physical, {
    widthMm: 32,
    heightMm: 32,
    thicknessMm: 3.2,
    cornerRadiusMm: 16,
  });

  assert.deepEqual(card.physical, {
    widthMm: 85.6,
    heightMm: 54,
    thicknessMm: 0.9,
    cornerRadiusMm: 3,
  });
});

test("all zones stay inside product boundaries", () => {
  zonesAreWithinBounds(getPhysicalSpec("tag"));
  zonesAreWithinBounds(getPhysicalSpec("card"));
});

test("card has more layout presets than tag", () => {
  const tag = getPhysicalSpec("tag");
  const card = getPhysicalSpec("card");

  assert.ok(card.layoutPresets.length > tag.layoutPresets.length);
});
