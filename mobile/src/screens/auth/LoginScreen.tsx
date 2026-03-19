import React, {useState, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
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
import {PasswordInput} from '../../components/PasswordInput';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';
import {
  getSupportedBiometry,
  hasStoredCredentials,
  getCredentialsWithBiometricPrompt,
  storeCredentialsWithBiometric,
  clearStoredCredentials,
  storeRememberMeCredentials,
  getRememberMeCredentials,
  clearRememberMeCredentials,
  type BiometryType,
} from '../../services/biometric';

type LoginMode = 'password' | 'otp';

export default function LoginScreen({
  navigation,
}: any): React.JSX.Element {
  const {t} = useTranslation();
  const [mode, setMode] = useState<LoginMode>('password');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [biometryType, setBiometryType] = useState<BiometryType>(null);
  const [showBiometric, setShowBiometric] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
            kycSkipped: profile.kycSkipped,
            passwordSet: profile.passwordSet,
            mfaEnabled: profile.mfaEnabled,
            isAdmin: !!profile.isAdmin,
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
      const [bio, hasCreds, remembered] = await Promise.all([
        getSupportedBiometry(),
        hasStoredCredentials(),
        getRememberMeCredentials(),
      ]);
      if (mounted) {
        setBiometryType(bio);
        setShowBiometric(!!(bio && hasCreds));
        if (remembered) {
          setContact(remembered.contact);
          setPassword(remembered.password);
          setRememberMe(true);
        }
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
      Alert.alert(t('common.error'), t('auth.invalidPassword'));
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.login(contact.trim(), password);
      const tokenData = data as {access_token: string; user?: any};
      const profile = tokenData.user;
      applyAuth(tokenData.access_token, profile);
      if (rememberMe) {
        await storeRememberMeCredentials(contact.trim(), password);
      } else {
        await clearRememberMeCredentials();
      }
      if (biometryType) {
        const bioType =
          biometryType === 'FaceID'
            ? t('auth.biometricFaceId')
            : biometryType === 'TouchID'
              ? t('auth.biometricTouchId')
              : t('auth.biometricFingerprint');
        Alert.alert(
          t('auth.biometricPrompt'),
          t('auth.biometricSave', {type: bioType}),
          [
            {text: t('auth.no')},
            {
              text: t('auth.yes'),
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
        t('common.error'),
        err.response?.data?.message || err.message || t('auth.loginError'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!contact.trim()) {
      Alert.alert(t('common.error'), t('auth.enterEmailOrPhone'));
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.sendOtp(contact.trim(), 'LOGIN');
      const res = data as {message?: string; devCode?: string};
      setOtpStep('verify');
      if (res.devCode) {
        Alert.alert(t('auth.devCodeTitle'), t('auth.devCode', {code: res.devCode}));
      }
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err.response?.data?.message || err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!contact.trim() || !otpCode.trim()) {
      Alert.alert(t('common.error'), t('auth.enterReceivedCode'));
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.verifyOtpLogin(contact.trim(), otpCode.trim());
      const profile = (data as any).user;
      applyAuth((data as any).access_token, profile);
      if (biometryType) {
        const bioType =
          biometryType === 'FaceID'
            ? t('auth.biometricFaceId')
            : biometryType === 'TouchID'
              ? t('auth.biometricTouchId')
              : t('auth.biometricFingerprint');
        Alert.alert(
          t('auth.biometricPrompt'),
          t('auth.biometricSave', {type: bioType}),
          [
            {text: t('auth.no')},
            {
              text: t('auth.yes'),
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
        t('common.error'),
        err.response?.data?.message || err.message || t('auth.invalidOrExpired'),
      );
    } finally {
      setLoading(false);
    }
  };

  const biometryLabel =
    biometryType === 'FaceID'
      ? t('auth.biometricFaceId')
      : biometryType === 'TouchID'
        ? t('auth.biometricTouchId')
        : biometryType
          ? t('auth.biometricFingerprint')
          : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Velle</Text>
        <Text style={styles.subtitle}>{t('app.tagline')}</Text>

        {showBiometric && biometryType && (
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricLogin}
            disabled={loading}>
            <Text style={styles.biometricIcon}>
              {biometryType === 'FaceID' ? '👤' : '👆'}
            </Text>
            <Text style={styles.biometricText}>
              {t('auth.loginWithBiometric', {type: biometryLabel})}
            </Text>
          </TouchableOpacity>
        )}

        {showBiometric && (
          <Text style={styles.divider}>{t('auth.loginManually')}</Text>
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
              {t('auth.passwordTab')}
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
              {t('auth.otpTab')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('auth.emailOrPhone')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailOrPhone')}
          value={contact}
          onChangeText={setContact}
          keyboardType={mode === 'otp' ? 'email-address' : 'default'}
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading && otpStep === 'request'}
        />

        {mode === 'password' && (
          <>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <PasswordInput
              inputStyle={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe(r => !r)}
              activeOpacity={0.7}
              disabled={loading}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{t('auth.rememberMe')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePasswordLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.login')}</Text>
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
                  <Text style={styles.buttonText}>{t('auth.sendCode')}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.label}>{t('auth.code')}</Text>
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
                    <Text style={styles.buttonText}>{t('auth.verifyAndLogin')}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOtpStep('request')}
                  disabled={loading}>
                  <Text style={styles.link}>{t('auth.resendCode')}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={loading}>
          <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          disabled={loading}>
          <Text style={styles.link}>{t('auth.noAccount')}</Text>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {backgroundColor: '#0066CC'},
  checkboxCheck: {color: '#fff', fontSize: 14, fontWeight: 'bold'},
  checkboxLabel: {fontSize: 14, color: '#333', flex: 1},
});
