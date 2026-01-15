export const VALIDATION = {
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 11,
    REGEX: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 32,
    REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/,
  },
  LICENSE_PLATE: {
    REGEX: /^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/,
  },
  OTP: {
    LENGTH: 6,
    REGEX: /^[0-9]{6}$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
} as const;