import { ParkingSlot, Position, SlotStatus } from "../../types/parking.types";

export const slotHelper = {
  getSlotById(slots: ParkingSlot[], id: string): ParkingSlot | undefined {
    return slots.find(slot => slot.id === id);
  },

  getSlotsByFloor(slots: ParkingSlot[], floor: number): ParkingSlot[] {
    return slots.filter(slot => slot.floor === floor);
  },

  getAvailableSlots(slots: ParkingSlot[]): ParkingSlot[] {
    return slots.filter(slot => slot.status === SlotStatus.AVAILABLE);
  },

  getNearestSlot(
    slots: ParkingSlot[],
    position: Position
  ): ParkingSlot | null {
    const available = this.getAvailableSlots(slots);
    if (available.length === 0) return null;

    return available.reduce((nearest, slot) => {
      const distToCurrent = this.calculateDistance(position, slot.position);
      const distToNearest = this.calculateDistance(position, nearest.position);
      return distToCurrent < distToNearest ? slot : nearest;
    });
  },

  getSlotsNearFeature(
    slots: ParkingSlot[],
    feature: string
  ): ParkingSlot[] {
    return slots.filter(slot => slot.features?.includes(feature as any));
  },

  calculateDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  },

  getSlotStatusColor(status: SlotStatus): string {
    const { COLORS } = require('../constants/colors');
    switch (status) {
      case SlotStatus.AVAILABLE:
        return COLORS.available;
      case SlotStatus.OCCUPIED:
        return COLORS.occupied;
      case SlotStatus.RESERVED:
        return COLORS.reserved;
      default:
        return COLORS.textSecondary;
    }
  },

  getFloorStats(slots: ParkingSlot[], floor: number) {
    const floorSlots = this.getSlotsByFloor(slots, floor);
    const total = floorSlots.length;
    const available = floorSlots.filter(
      s => s.status === SlotStatus.AVAILABLE
    ).length;
    const occupied = floorSlots.filter(
      s => s.status === SlotStatus.OCCUPIED
    ).length;
    const reserved = floorSlots.filter(
      s => s.status === SlotStatus.RESERVED
    ).length;

    return {
      total,
      available,
      occupied,
      reserved,
      occupancyRate: total > 0 ? (occupied + reserved) / total : 0,
    };
  },
};