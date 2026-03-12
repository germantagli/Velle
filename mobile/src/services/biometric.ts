import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'velle.app';
const KEYCHAIN_USER = 'velle-credentials';
const REMEMBER_ME_SERVICE = 'velle.app.remember';
const REMEMBER_ME_USER = 'velle-remember';

export type BiometryType = 'FaceID' | 'TouchID' | 'Biometrics' | 'Fingerprint' | 'Face' | null;

export async function getSupportedBiometry(): Promise<BiometryType> {
  try {
    const type = await Keychain.getSupportedBiometryType();
    return type as BiometryType;
  } catch {
    return null;
  }
}

export async function hasStoredCredentials(): Promise<boolean> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    return !!creds?.password;
  } catch {
    return false;
  }
}

const BIOMETRIC_ACCESS =
  Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE;

export async function storeCredentialsWithBiometric(
  token: string,
  userJson: string,
): Promise<boolean> {
  try {
    const biometry = await getSupportedBiometry();
    const useBiometric =
      biometry === 'FaceID' ||
      biometry === 'TouchID' ||
      biometry === 'Biometrics' ||
      biometry === 'Fingerprint' ||
      biometry === 'Face';
    await Keychain.setGenericPassword(
      KEYCHAIN_USER,
      JSON.stringify({token, user: userJson}),
      {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        ...(useBiometric && {accessControl: BIOMETRIC_ACCESS}),
      },
    );
    return true;
  } catch {
    return false;
  }
}

export async function getCredentialsWithBiometric(): Promise<{
  token: string;
  user: string;
} | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    if (!creds?.password) return null;
    const parsed = JSON.parse(creds.password) as {token: string; user: string};
    return parsed;
  } catch {
    return null;
  }
}

/** Solicita biometría y devuelve credenciales si están almacenadas con protección biométrica */
export async function getCredentialsWithBiometricPrompt(): Promise<{
  token: string;
  user: string;
} | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
      accessControl: BIOMETRIC_ACCESS,
    });
    if (!creds?.password) return null;
    const parsed = JSON.parse(creds.password) as {token: string; user: string};
    return parsed;
  } catch {
    return null;
  }
}

export async function clearStoredCredentials(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
  } catch {
    // ignore
  }
}

/** Recordar usuario y contraseña (solo para modo contraseña) */
export async function storeRememberMeCredentials(
  contact: string,
  password: string,
): Promise<void> {
  try {
    await Keychain.setGenericPassword(
      REMEMBER_ME_USER,
      JSON.stringify({contact, password}),
      {service: REMEMBER_ME_SERVICE, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED},
    );
  } catch {
    // ignore
  }
}

export async function getRememberMeCredentials(): Promise<{
  contact: string;
  password: string;
} | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: REMEMBER_ME_SERVICE,
    });
    if (!creds?.password) return null;
    return JSON.parse(creds.password) as {contact: string; password: string};
  } catch {
    return null;
  }
}

export async function clearRememberMeCredentials(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({service: REMEMBER_ME_SERVICE});
  } catch {
    // ignore
  }
}
