export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/us/login',
  REGISTER: '/api/us/register',
  VERIFY_EMAIL: '/api/us/verify-email',
  REFRESH_TOKEN: '/api/us/refresh-token',
  LOGOUT: '/api/us/logout',
  FORGOT_PASSWORD: '/api/us/forgot-password',

  // User
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',

  // Vehicles
  GET_VEHICLES: '/api/us/getListVehicles',
  GET_VEHICLE_DETAIL: '/api/us/getDetailVehilces',
  CREATE_VEHICLE: '/api/us/updateVehicles',
  UPDATE_VEHICLE: '/api/us/updateVehicles',
  DELETE_VEHICLE: '/api/us/deleteVehilces',
  SET_DEFAULT_VEHICLE: (id: string) => `/vehicles/${id}/set-default`,

  // Wallet
  GET_WALLET: '/api/us/wallet/getWallet',
  GET_WALLET_HISTORY: '/api/us/wallet/getHistory',
  PAY_WITH_WALLET: '/api/us/wallet/pay',
  CREATE_TOPUP_QR: '/api/us/payment/create-qr',

  // Parking
  GET_PARKING_LOTS: '/parking/lots',
  GET_PARKING_LOT: (id: string) => `/parking/lots/${id}`,
  GET_FLOORS: (lotId: string) => `/parking/lots/${lotId}/floors`,
  GET_SLOTS: (lotId: string, floor?: number) =>
    `/parking/lots/${lotId}/slots${floor ? `?floor=${floor}` : ''}`,
  GET_SLOT: (slotId: string) => `/parking/slots/${slotId}`,
  GET_AVAILABLE_SLOTS: (lotId: string) => `/parking/lots/${lotId}/available`,
  GET_MAP: '/api/us/getParkingMap',

  // Bookings
  GET_BOOKINGS: '/api/us/getListBooking',
  CREATE_BOOKING: '/api/us/bookingSlot',
  GET_BOOKING: (id: string) => `/bookings/${id}`,
  CANCEL_BOOKING: '/api/us/cancelBooking',
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
