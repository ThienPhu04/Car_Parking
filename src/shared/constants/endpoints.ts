export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/us/login',
  REGISTER: '/api/us/register',
  VERIFY_OTP: '/api/us/verify-otp',
  REFRESH_TOKEN: '/api/us/refresh-token',
  LOGOUT: '/api/us/logout',
  FORGOT_PASSWORD: '/api/us/forgot-password',
  
  // User
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  
  // Vehicles
  GET_VEHICLES: '/vehicles',
  CREATE_VEHICLE: '/vehicles',
  UPDATE_VEHICLE: (id: string) => `/vehicles/${id}`,
  DELETE_VEHICLE: (id: string) => `/vehicles/${id}`,
  SET_DEFAULT_VEHICLE: (id: string) => `/vehicles/${id}/set-default`,
  
  // Parking
  GET_PARKING_LOTS: '/parking/lots',
  GET_PARKING_LOT: (id: string) => `/parking/lots/${id}`,
  GET_FLOORS: (lotId: string) => `/parking/lots/${lotId}/floors`,
  GET_SLOTS: (lotId: string, floor?: number) => 
    `/parking/lots/${lotId}/slots${floor ? `?floor=${floor}` : ''}`,
  GET_SLOT: (slotId: string) => `/parking/slots/${slotId}`,
  GET_AVAILABLE_SLOTS: (lotId: string) => `/parking/lots/${lotId}/available`,
  
  // Bookings
  GET_BOOKINGS: '/bookings',
  CREATE_BOOKING: '/bookings',
  GET_BOOKING: (id: string) => `/bookings/${id}`,
  CANCEL_BOOKING: (id: string) => `/bookings/${id}/cancel`,
  GET_ACTIVE_BOOKING: '/bookings/active',
  
  // Notifications
  GET_NOTIFICATIONS: '/notifications',
  MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_AS_READ: '/notifications/read-all',
  DELETE_NOTIFICATION: (id: string) => `/notifications/${id}`,
  
  // Statistics
  GET_STATS: '/stats/dashboard',
  GET_PARKING_HISTORY: '/stats/parking-history',
} as const;