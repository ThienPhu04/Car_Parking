export enum VehicleType {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  TRUCK = 'truck',
}

export interface Vehicle {
  id: string;
  userId: string;
  licensePlate: string;
  type: VehicleType;
  brand?: string;
  model?: string;
  color?: string;
  isDefault: boolean;
}