import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';
import {
  getSupportedBiometry,
  hasStoredCredentials,
  getCredentialsWithBiometricPrompt,
  storeCredentialsWithBiometric,
  clearStoredCredentials,
  type BiometryType,
} from '../../services/biometric';

type LoginMode = 'password' | 'otp';

export default function LoginScreen({
  navigation,
}: any): React.JSX.Element {
  const [mode, setMode] = useState<LoginMode>('password');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [biometryType, setBiometryType] = useState<BiometryType>(null);
  const [showBiometric, setShowBiometric] = useState(false);

  const setAuth = useAuthStore(s => s.setAuth);
  const logout = useAuthStore(s => s.logout);

  const applyAuth = useCallback(
    (token: string, profile: any, saveBiometric?: boolean) => {
      const user = profile
        ? {
            id: profile.id,
            email: profile.email,
            phone: profile.phone || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            kycStatus: profile.kycStatus,
          }
        : undefined;
      setAuth({
        token,
        refreshToken: token,
        user,
        needsMFA: profile?.mfaEnabled && !profile?.mfaVerified,
      });
      if (saveBiometric && user) {
        storeCredentialsWithBiometric(token, JSON.stringify(user));
      }
    },
    [setAuth],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [bio, hasCreds] = await Promise.all([
        getSupportedBiometry(),
        hasStoredCredentials(),
      ]);
      if (mounted) {
        setBiometryType(bio);
        setShowBiometric(!!(bio && hasCreds));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const creds = await getCredentialsWithBiometricPrompt();
      if (creds) {
        const user = JSON.parse(creds.user);
        applyAuth(creds.token, user, false);
      } else {
        clearStoredCredentials();
        setShowBiometric(false);
      }
    } catch (e) {
      setShowBiometric(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!contact.trim() || !password) {
      Alert.alert('Error', 'Ingresa email/teléfono y contraseña');
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.login(contact.trim(), password);
      const tokenData = data as {access_token: string; user?: any};
      const profile = tokenData.user;
      applyAuth(tokenData.access_token, profile);
      if (biometryType) {
        Alert.alert(
          '¿Usar biometría?',
          `¿Guardar acceso con ${biometryType === 'FaceID' ? 'Face ID' : biometryType === 'TouchID' ? 'Touch ID' : 'huella dactilar'} para el próximo inicio?`,
          [
            {text: 'No'},
            {
              text: 'Sí',
              onPress: () => {
                if (profile)
                  storeCredentialsWithBiometric(
                    tokenData.access_token,
                    JSON.stringify(profile),
                  );
              },
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Error al iniciar sesión',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!contact.trim()) {
      Alert.alert('Error', 'Ingresa tu email o teléfono');
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.sendOtp(contact.trim(), 'LOGIN');
      const res = data as {message?: string; devCode?: string};
      setOtpStep('verify');
      if (res.devCode) {
        Alert.alert('Código (desarrollo)', `Tu código: ${res.devCode}`);
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Error al enviar el código',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!contact.trim() || !otpCode.trim()) {
      Alert.alert('Error', 'Ingresa el código recibido');
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.verifyOtpLogin(contact.trim(), otpCode.trim());
      const profile = (data as any).user;
      applyAuth((data as any).access_token, profile);
      if (biometryType) {
        Alert.alert(
          '¿Usar biometría?',
          `¿Guardar acceso con ${biometryType === 'FaceID' ? 'Face ID' : biometryType === 'TouchID' ? 'Touch ID' : 'huella'} para el próximo inicio?`,
          [
            {text: 'No'},
            {
              text: 'Sí',
              onPress: () => {
                if (profile)
                  storeCredentialsWithBiometric(
                    (data as any).access_token,
                    JSON.stringify(profile),
                  );
              },
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Código inválido o expirado',
      );
    } finally {
      setLoading(false);
    }
  };

  const biometryLabel =
    biometryType === 'FaceID'
      ? 'Face ID'
      : biometryType === 'TouchID'
        ? 'Touch ID'
        : biometryType
          ? 'Huella dactilar'
          : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Velle</Text>
        <Text style={styles.subtitle}>Plataforma Financiera Venezuela</Text>

        {showBiometric && biometryType && (
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricLogin}
            disabled={loading}>
            <Text style={styles.biometricIcon}>
              {biometryType === 'FaceID' ? '👤' : '👆'}
            </Text>
            <Text style={styles.biometricText}>
              Iniciar con {biometryLabel}
            </Text>
          </TouchableOpacity>
        )}

        {showBiometric && (
          <Text style={styles.divider}>o inicia sesión manualmente</Text>
        )}

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'password' && styles.tabActive]}
            onPress={() => {
              setMode('password');
              setOtpStep('request');
            }}>
            <Text
              style={[
                styles.tabText,
                mode === 'password' && styles.tabTextActive,
              ]}>
              Contraseña
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'otp' && styles.tabActive]}
            onPress={() => {
              setMode('otp');
              setOtpStep('request');
            }}>
            <Text
              style={[styles.tabText, mode === 'otp' && styles.tabTextActive]}>
              Código OTP
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          {mode === 'password' ? 'Email o teléfono' : 'Email o teléfono'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com o +58 412 1234567"
          value={contact}
          onChangeText={setContact}
          keyboardType={mode === 'otp' ? 'email-address' : 'default'}
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading && otpStep === 'request'}
        />

        {mode === 'password' && (
          <>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePasswordLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {mode === 'otp' && (
          <>
            {otpStep === 'request' ? (
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Enviar código</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.label}>Código</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtpLogin}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verificar e iniciar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOtpStep('request')}
                  disabled={loading}>
                  <Text style={styles.link}>Reenviar código</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={loading}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          disabled={loading}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', justifyContent: 'center'},
  content: {padding: 24},
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  biometricIcon: {fontSize: 24},
  biometricText: {fontSize: 16, fontWeight: '600', color: '#1a1a2e'},
  divider: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabs: {flexDirection: 'row', marginBottom: 16},
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  tabActive: {borderBottomColor: '#0066CC'},
  tabText: {fontSize: 14, color: '#666'},
  tabTextActive: {fontWeight: '600', color: '#0066CC'},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  link: {color: '#0066CC', textAlign: 'center', fontSize: 14, marginBottom: 8},
});
