import { VALIDATION } from "../constants/validations";


export const validate = {
  phone(phone: string): boolean {
    return VALIDATION.PHONE.REGEX.test(phone);
  },

  email(email: string): boolean {
    return VALIDATION.EMAIL.REGEX.test(email);
  },

  password(password: string): boolean {
    return (
      password.length >= VALIDATION.PASSWORD.MIN_LENGTH &&
      password.length <= VALIDATION.PASSWORD.MAX_LENGTH
    );
  },

  licensePlate(plate: string): boolean {
    return VALIDATION.LICENSE_PLATE.REGEX.test(plate);
  },

  otp(otp: string): boolean {
    return VALIDATION.OTP.REGEX.test(otp);
  },

  name(name: string): boolean {
    return (
      name.length >= VALIDATION.NAME.MIN_LENGTH &&
      name.length <= VALIDATION.NAME.MAX_LENGTH
    );
  },

  required(value: any): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },
};