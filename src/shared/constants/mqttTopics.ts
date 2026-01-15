export const MQTT_TOPICS = {
  SLOT_STATUS: (lotId: string, floor: number) => `parking/${lotId}/floor${floor}/+`,
  SLOT_UPDATE: (lotId: string, slotId: string) => `parking/${lotId}/slot/${slotId}`,
  PARKING_STATS: (lotId: string) => `parking/${lotId}/stats`,
  SYSTEM_ANNOUNCEMENT: 'system/announcement',
} as const;