import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {authApi} from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({navigation}: any): React.JSX.Element {
  const [step, setStep] = useState<'contact' | 'verify' | 'form'>('contact');
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEmail = EMAIL_REGEX.test(contact.trim());

  const handleRequestOtp = async () => {
    const t = contact.trim();
    if (!t) {
      Alert.alert('Error', 'Ingresa tu email o teléfono');
      return;
    }
    if (EMAIL_REGEX.test(t) || /^\d{10,}$/.test(t.replace(/\D/g, ''))) {
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
    } else {
      Alert.alert('Error', 'Email o teléfono inválido');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Ingresa el código');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtpRegister(contact.trim(), otpCode.trim());
      setStep('form');
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || e.message || 'Código inválido o expirado',
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!firstName.trim()) return 'Ingresa tu nombre';
    if (!lastName.trim()) return 'Ingresa tu apellido';
    if (!password) return 'Ingresa una contraseña';
    if (password.length < 8)
      return 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    if (!isEmail && !phone.trim())
      return 'Si usaste teléfono, ingresa tu email para la cuenta';
    if (isEmail === false && phone.trim() && !EMAIL_REGEX.test(phone.trim()))
      return 'Email inválido';
    return null;
  };

  const handleRegister = async () => {
    const err = validateForm();
    if (err) {
      Alert.alert('Error', err);
      return;
    }
    setLoading(true);
    try {
      await authApi.registerWithOtp({
        contact: contact.trim(),
        email: isEmail ? contact.trim() : phone.trim() || undefined,
        phone: isEmail ? (phone.trim() || undefined) : contact.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      Alert.alert('Éxito', 'Cuenta creada. Inicia sesión.', [
        {text: 'OK', onPress: () => navigation.replace('Login')},
      ]);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || e.message || 'Error al registrarse',
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'contact') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Ingresa tu email o teléfono para verificar tu identidad
        </Text>
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
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
          style={styles.backBtn}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'verify') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Verifica tu cuenta</Text>
        <Text style={styles.subtitle}>
          Ingresa el código enviado a {contact}
        </Text>
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
          onPress={handleVerifyOtp}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStep('contact')}
          disabled={loading}>
          <Text style={styles.link}>Cambiar email/teléfono</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Completa tu perfil</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Tu nombre"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        editable={!loading}
      />
      <Text style={styles.label}>Apellido</Text>
      <TextInput
        style={styles.input}
        placeholder="Tu apellido"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        editable={!loading}
      />
      {!isEmail ? (
        <>
          <Text style={styles.label}>Email (para la cuenta) *</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            value={phone}
            onChangeText={setPhone}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Teléfono (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+58 412 1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </>
      )}
      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Confirmar contraseña</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Repite la contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Text style={styles.eyeIcon}>
            {showConfirmPassword ? '🙈' : '👁'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
        style={styles.backBtn}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
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
  passwordWrapper: {position: 'relative', marginBottom: 16},
  inputWithIcon: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {fontSize: Platform.OS === 'ios' ? 20 : 22},
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
  backBtn: {alignItems: 'center'},
  link: {color: '#0066CC', fontSize: 14},
});
