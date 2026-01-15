import { SlotStatus } from "./parking.types";

export interface MQTTMessage {
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
}

export interface SlotUpdateMessage {
  slotId: string;
  status: SlotStatus;
  timestamp: string;
}

export interface MQTTConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId: string;
  reconnectPeriod?: number;
  connectTimeout?: number;
}