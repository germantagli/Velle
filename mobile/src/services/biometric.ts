import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'velle.app';
const KEYCHAIN_USER = 'velle-credentials';

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
