const KAZAKHSTAN_COUNTRY_CODE = '7';
const KAZAKHSTAN_LOCAL_LENGTH = 10;
const KAZAKHSTAN_FULL_LENGTH = 11;

export type PhoneValidationResult = {
  displayValue: string;
  isValid: boolean;
  message: string | null;
  normalizedPhoneNumber: string | null;
};

function getDigits(rawValue: string) {
  return rawValue.replace(/\D/g, '');
}

function getLocalKazakhstanDigits(rawValue: string) {
  const digits = getDigits(rawValue);

  if (!digits.length) {
    return '';
  }

  if (digits.startsWith('8') || digits.startsWith(KAZAKHSTAN_COUNTRY_CODE)) {
    return digits.slice(1, KAZAKHSTAN_FULL_LENGTH);
  }

  return digits.slice(0, KAZAKHSTAN_LOCAL_LENGTH);
}

export function formatKazakhstanPhoneInput(rawValue: string) {
  const localDigits = getLocalKazakhstanDigits(rawValue).slice(0, KAZAKHSTAN_LOCAL_LENGTH);
  const segments = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 8),
    localDigits.slice(8, 10),
  ].filter(Boolean);

  return segments.length ? `+7-${segments.join('-')}` : '+7';
}

export function normalizeKazakhstanPhoneNumber(rawValue: string) {
  const localDigits = getLocalKazakhstanDigits(rawValue);

  if (localDigits.length !== KAZAKHSTAN_LOCAL_LENGTH) {
    return null;
  }

  return `+${KAZAKHSTAN_COUNTRY_CODE}${localDigits}`;
}

export function validateKazakhstanPhoneNumber(rawValue: string): PhoneValidationResult {
  const displayValue = formatKazakhstanPhoneInput(rawValue);
  const normalizedPhoneNumber = normalizeKazakhstanPhoneNumber(rawValue);
  const normalizedDigits = normalizedPhoneNumber?.replace(/\D/g, '') ?? null;

  if (!getLocalKazakhstanDigits(rawValue).length) {
    return {
      displayValue,
      isValid: false,
      message: 'Enter your Kazakhstan phone number to continue.',
      normalizedPhoneNumber: null,
    };
  }

  if (!normalizedPhoneNumber || normalizedDigits?.length !== KAZAKHSTAN_FULL_LENGTH) {
    return {
      displayValue,
      isValid: false,
      message: 'Enter the full number in +7-777-123-45-67 format.',
      normalizedPhoneNumber: null,
    };
  }

  return {
    displayValue,
    isValid: true,
    message: null,
    normalizedPhoneNumber,
  };
}

export function formatPhoneNumberForDisplay(rawValue: string | null | undefined) {
  if (!rawValue) {
    return '+7';
  }

  return formatKazakhstanPhoneInput(rawValue);
}

export function buildPhoneUserName(phoneNumber: string | null | undefined) {
  const digits = phoneNumber?.replace(/\D/g, '') ?? '';
  const suffix = digits.slice(-4) || 'Client';

  return `AVISHU ${suffix}`;
}
