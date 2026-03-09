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
} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({navigation}: any): React.JSX.Element {
  const [step, setStep] = useState<'contact' | 'verify'>('contact');
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);

  const handleRequestOtp = async () => {
    const t = contact.trim();
    if (!t) {
      Alert.alert('Error', 'Ingresa tu email o teléfono');
      return;
    }
    if (!EMAIL_REGEX.test(t) && !/^\d{10,}$/.test(t.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Email o teléfono inválido');
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.sendOtp(t, 'REGISTER');
      const res = data as {message?: string; devCode?: string};
      setStep('verify');
      if (res.devCode) {
        Alert.alert('Código (desarrollo)', `Tu código: ${res.devCode}`);
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || e.message || 'Error al enviar el código',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Ingresa el código');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtpRegister(contact.trim(), otpCode.trim());
      const {data} = await authApi.register(contact.trim());
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
            }
          : undefined,
        needsMFA: profile?.mfaEnabled && !profile?.mfaVerified,
      });
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || e.message || 'Error al registrar',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'contact' ? 'Crear cuenta' : 'Verifica tu cuenta'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'contact'
            ? 'Ingresa tu email o teléfono. Te enviaremos un código.'
            : `Ingresa el código enviado a ${contact}`}
        </Text>

        {step === 'contact' ? (
          <>
            <Text style={styles.label}>Email o teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com o +58 412 1234567"
              value={contact}
              onChangeText={setContact}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
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
          </>
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
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStep('contact')}
              disabled={loading}>
              <Text style={styles.link}>Cambiar email/teléfono</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
          style={styles.backBtn}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', justifyContent: 'center'},
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
