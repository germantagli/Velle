import React, {useState} from 'react';
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
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';
import {COUNTRY_CODES} from '../../constants/countryCodes';
import {VENEZUELA_OPERATORS} from '../../constants/venezuelaOperators';
import {PickerSelect, PickerOption} from '../../components/PickerSelect';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VENEZUELA_COUNTRY_CODE = '+58';

/** Valida teléfono Venezuela: 412/414/etc + 7 dígitos */
function isValidVenezuelaPhone(operator: string, rest: string): boolean {
  if (!operator || !rest) return false;
  const digits = rest.replace(/\D/g, '');
  return digits.length === 7 && /^\d{7}$/.test(digits);
}

/** Valida teléfono internacional (número completo después del código) */
function isValidInternationalPhone(dialCode: string, number: string): boolean {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  return /^\d+$/.test(digits);
}

/** Construye el contacto teléfono para enviar al backend */
function buildPhoneContact(
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

const countryOptions: PickerOption<string>[] = COUNTRY_CODES.map(c => ({
  value: c.dialCode,
  label: `${c.dialCode} ${c.name}`,
  flag: c.flag,
}));

const operatorOptions: PickerOption<string>[] = VENEZUELA_OPERATORS.map(o => ({
  value: o.prefix,
  label: `${o.prefix} - ${o.operator}`,
}));

export default function RegisterScreen({navigation}: any): React.JSX.Element {
  const {t} = useTranslation();
  const [step, setStep] = useState<'contact' | 'verify'>('contact');
  const [contactType, setContactType] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState(VENEZUELA_COUNTRY_CODE);
  const [operator, setOperator] = useState('414');
  const [phoneRest, setPhoneRest] = useState('');
  const [phoneFull, setPhoneFull] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);

  const isVenezuela = countryCode === VENEZUELA_COUNTRY_CODE;
  const contact =
    contactType === 'email'
      ? email.trim()
      : buildPhoneContact(
          countryCode,
          isVenezuela,
          operator,
          isVenezuela ? phoneRest : phoneFull,
        );

  const validateContact = (): string | null => {
    if (contactType === 'email') {
      const trimmed = email.trim();
      if (!trimmed) return t('auth.enterEmail');
      if (!EMAIL_REGEX.test(trimmed)) return t('auth.invalidEmail');
      return null;
    }
    // Phone
    if (isVenezuela) {
      if (!isValidVenezuelaPhone(operator, phoneRest)) {
        return t('auth.invalidPhoneVenezuela');
      }
    } else {
      if (!isValidInternationalPhone(countryCode, phoneFull)) {
        return t('auth.invalidPhoneInternational');
      }
    }
    return null;
  };

  const handleRequestOtp = async () => {
    const err = validateContact();
    if (err) {
      Alert.alert(t('common.error'), err);
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.sendOtp(contact, 'REGISTER');
      const res = data as {message?: string; devCode?: string};
      setStep('verify');
      if (res.devCode) {
        Alert.alert(t('auth.devCodeTitle'), t('auth.devCode', {code: res.devCode}));
      }
    } catch (e: any) {
      Alert.alert(
        t('common.error'),
        e.response?.data?.message || e.message || 'Error al enviar el código',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otpCode.trim()) {
      Alert.alert(t('common.error'), t('auth.enterCode'));
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtpRegister(contact, otpCode.trim());
      const {data} = await authApi.register(contact);
      const res = data as {access_token: string; user: any};
      const profile = res.user;
      setAuth({
        token: res.access_token,
        refreshToken: res.access_token,
        user: profile
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
            }
          : undefined,
        needsMFA: profile?.mfaEnabled && !profile?.mfaVerified,
      });
    } catch (e: any) {
      Alert.alert(
        t('common.error'),
        e.response?.data?.message || e.message || t('auth.registerError'),
      );
    } finally {
      setLoading(false);
    }
  };

  const displayContact =
    contactType === 'email'
      ? contact
      : isVenezuela
        ? `${countryCode} ${operator} ${phoneRest.replace(/\D/g, '').slice(0, 7)}`
        : `${countryCode} ${phoneFull.replace(/\D/g, '').slice(0, 15)}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>
            {step === 'contact' ? t('auth.register') : t('auth.verifyAccount')}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'contact'
              ? t('auth.createAccount')
              : t('auth.codeSentTo', {contact: displayContact})}
          </Text>

          {step === 'contact' ? (
            <>
              <Text style={styles.label}>{t('auth.howToRegister')}</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={[
                    styles.radio,
                    contactType === 'email' && styles.radioSelected,
                  ]}
                  onPress={() => setContactType('email')}>
                  <View
                    style={[
                      styles.radioDot,
                      contactType === 'email' && styles.radioDotSelected,
                    ]}
                  />
                  <Text style={styles.radioLabel}>{t('auth.withEmail')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radio,
                    contactType === 'phone' && styles.radioSelected,
                  ]}
                  onPress={() => setContactType('phone')}>
                  <View
                    style={[
                      styles.radioDot,
                      contactType === 'phone' && styles.radioDotSelected,
                    ]}
                  />
                  <Text style={styles.radioLabel}>{t('auth.withPhone')}</Text>
                </TouchableOpacity>
              </View>

              {contactType === 'email' ? (
                <>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.email')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t('auth.countryCode')}</Text>
                  <PickerSelect
                    options={countryOptions}
                    value={countryCode}
                    onValueChange={v => {
                      setCountryCode(v);
                      if (v !== VENEZUELA_COUNTRY_CODE) {
                        setPhoneFull('');
                      } else {
                        setPhoneRest('');
                      }
                    }}
                    renderOption={opt =>
                      opt.flag ? `${opt.flag} ${opt.label}` : opt.label
                    }
                  />
                  {isVenezuela ? (
                    <>
                      <Text style={[styles.label, {marginTop: 16}]}>
                        {t('auth.operator')}
                      </Text>
                      <PickerSelect
                        options={operatorOptions}
                        value={operator}
                        onValueChange={setOperator}
                      />
                      <Text style={[styles.label, {marginTop: 16}]}>
                        {t('auth.phoneDigits')}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1234567"
                        value={phoneRest}
                        onChangeText={t =>
                          setPhoneRest(t.replace(/\D/g, '').slice(0, 7))
                        }
                        keyboardType="number-pad"
                        maxLength={7}
                        editable={!loading}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.label, {marginTop: 16}]}>
                        {t('auth.phoneNumber')}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: 5551234567"
                        value={phoneFull}
                        onChangeText={t =>
                          setPhoneFull(t.replace(/\D/g, '').slice(0, 15))
                        }
                        keyboardType="phone-pad"
                        editable={!loading}
                      />
                    </>
                  )}
                </>
              )}

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
            </>
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
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.register')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep('contact')}
                disabled={loading}>
                <Text style={styles.link}>{t('auth.changeContact')}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.backBtn}>
            <Text style={styles.link}>{t('auth.hasAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', justifyContent: 'center'},
  scrollContent: {flexGrow: 1, paddingBottom: 32},
  content: {padding: 24},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#1a1a2e'},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 24},
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
  radioRow: {flexDirection: 'row', marginBottom: 20, gap: 24},
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 16,
  },
  radioSelected: {},
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  radioDotSelected: {backgroundColor: '#0066CC'},
  radioLabel: {fontSize: 16, color: '#333'},
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
  backBtn: {alignItems: 'center', marginTop: 8},
  link: {color: '#0066CC', fontSize: 14},
});
