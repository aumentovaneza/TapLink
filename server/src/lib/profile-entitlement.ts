import type { OrderStatus } from "@prisma/client";

type TagCounter = {
  count(args: { where: { ownerId: string } }): Promise<number>;
};

type OrderCounter = {
  count(args: { where: { userId: string; status: { in: OrderStatus[] } } }): Promise<number>;
};

export interface ProfileEntitlementDataSource {
  tag: TagCounter;
  order?: OrderCounter;
}

export interface UnitOwnershipSnapshot {
  claimedUnits: number;
  purchasedUnits: number;
}

export const purchasedOrderStatuses: OrderStatus[] = ["PROCESSING", "READY", "SHIPPED", "COMPLETED"];

export async function loadUnitOwnershipSnapshot(
  dataSource: ProfileEntitlementDataSource,
  userId: string
): Promise<UnitOwnershipSnapshot> {
  const claimedUnitsPromise = dataSource.tag.count({
    where: { ownerId: userId },
  });

  const orderCounter = dataSource.order && typeof dataSource.order.count === "function" ? dataSource.order : null;
  const purchasedUnitsPromise = orderCounter
    ? orderCounter.count({
        where: {
          userId,
          status: {
            in: purchasedOrderStatuses,
          },
        },
      })
    : Promise.resolve(0);

  const [claimedUnits, purchasedUnits] = await Promise.all([claimedUnitsPromise, purchasedUnitsPromise]);

  return {
    claimedUnits,
    purchasedUnits,
  };
}

export function canCreateProfileFromOwnership(snapshot: UnitOwnershipSnapshot): boolean {
  return snapshot.claimedUnits > 0 || snapshot.purchasedUnits > 0;
}
