import {COUNTRY_CODES} from '../constants/countryCodes';
import {VENEZUELA_OPERATORS} from '../constants/venezuelaOperators';

export const VENEZUELA_COUNTRY_CODE = '+58';

/** Construye el contacto teléfono para enviar al backend */
export function buildPhoneContact(
  dialCode: string,
  isVenezuela: boolean,
  operator: string,
  restOrFull: string,
): string {
  const digits = restOrFull.replace(/\D/g, '');
  const codeDigits = dialCode.replace(/\D/g, '');
  if (isVenezuela) {
    return `${codeDigits}${operator}${digits}`;
  }
  return `${codeDigits}${digits}`;
}

export interface ParsedPhone {
  countryCode: string;
  operator: string;
  phoneRest: string;
  phoneFull: string;
}

/** Parsea un teléfono almacenado (E.164: dígitos) en countryCode, operator, rest/full */
export function parseStoredPhone(stored: string | null | undefined): ParsedPhone | null {
  if (!stored || typeof stored !== 'string') return null;
  const digits = stored.replace(/\D/g, '');
  if (digits.length < 8) return null;

  const codesByLength = [...COUNTRY_CODES]
    .map(c => ({...c, codeDigits: c.dialCode.replace(/\D/g, '')}))
    .filter(c => c.codeDigits.length > 0)
    .sort((a, b) => b.codeDigits.length - a.codeDigits.length);

  for (const {dialCode, codeDigits} of codesByLength) {
    if (!digits.startsWith(codeDigits)) continue;
    const rest = digits.slice(codeDigits.length);
    if (dialCode === VENEZUELA_COUNTRY_CODE) {
      const op = VENEZUELA_OPERATORS.find(o => rest.startsWith(o.prefix));
      if (op) {
        const phoneRest = rest.slice(op.prefix.length).slice(0, 7);
        return {
          countryCode: dialCode,
          operator: op.prefix,
          phoneRest,
          phoneFull: '',
        };
      }
    }
    return {
      countryCode: dialCode,
      operator: '',
      phoneRest: '',
      phoneFull: rest,
    };
  }
  return null;
}
