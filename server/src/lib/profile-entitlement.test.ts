import assert from "node:assert/strict";
import test from "node:test";

import {
  canCreateProfileFromOwnership,
  loadUnitOwnershipSnapshot,
  purchasedOrderStatuses,
  type ProfileEntitlementDataSource,
} from "./profile-entitlement";

test("profile creation is blocked when user has no claimed or purchased units", async () => {
  const dataSource: ProfileEntitlementDataSource = {
    tag: {
      count: async () => 0,
    },
    order: {
      count: async () => 0,
    },
  };

  const snapshot = await loadUnitOwnershipSnapshot(dataSource, "user-1");

  assert.deepEqual(snapshot, { claimedUnits: 0, purchasedUnits: 0 });
  assert.equal(canCreateProfileFromOwnership(snapshot), false);
});

test("profile creation is allowed when user owns at least one claimed unit", async () => {
  const dataSource: ProfileEntitlementDataSource = {
    tag: {
      count: async () => 1,
    },
  };

  const snapshot = await loadUnitOwnershipSnapshot(dataSource, "user-2");

  assert.deepEqual(snapshot, { claimedUnits: 1, purchasedUnits: 0 });
  assert.equal(canCreateProfileFromOwnership(snapshot), true);
});

test("profile creation is allowed when user has at least one paid order", async () => {
  let capturedArgs: { where: { userId: string; status: { in: string[] } } } | null = null;

  const dataSource: ProfileEntitlementDataSource = {
    tag: {
      count: async () => 0,
    },
    order: {
      count: async (args) => {
        capturedArgs = args as { where: { userId: string; status: { in: string[] } } };
        return 2;
      },
    },
  };

  const snapshot = await loadUnitOwnershipSnapshot(dataSource, "user-3");

  assert.equal(snapshot.claimedUnits, 0);
  assert.equal(snapshot.purchasedUnits, 2);
  assert.equal(canCreateProfileFromOwnership(snapshot), true);
  assert.deepEqual(capturedArgs, {
    where: {
      userId: "user-3",
      status: {
        in: purchasedOrderStatuses,
      },
    },
  });
});

test("profile creation remains blocked when order delegate is unavailable", async () => {
  const dataSource: ProfileEntitlementDataSource = {
    tag: {
      count: async () => 0,
    },
  };

  const snapshot = await loadUnitOwnershipSnapshot(dataSource, "user-4");

  assert.deepEqual(snapshot, { claimedUnits: 0, purchasedUnits: 0 });
  assert.equal(canCreateProfileFromOwnership(snapshot), false);
});
