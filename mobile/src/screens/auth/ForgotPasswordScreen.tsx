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
import {PasswordInput} from '../../components/PasswordInput';
import {authApi} from '../../services/api';

export default function ForgotPasswordScreen({
  navigation,
}: any): React.JSX.Element {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresa tu email');
      return;
    }
    setLoading(true);
    try {
      const {data} = await authApi.forgotPassword(email.trim());
      const res = data as {message?: string; devCode?: string};
      setStep(2);
      if (res.devCode) {
        Alert.alert(
          'Código (desarrollo)',
          `Tu código es: ${res.devCode}\n\nEn producción recibirás el código por email.`,
        );
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

  const handleResetPassword = async () => {
    if (!code.trim() || newPassword.length < 6) {
      Alert.alert(
        'Error',
        'Ingresa el código y una contraseña de al menos 6 caracteres',
      );
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert('Listo', 'Contraseña actualizada. Ya puedes iniciar sesión.', [
        {text: 'OK', onPress: () => navigation.replace('Login')},
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Error al restablecer',
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
        <Text style={styles.title}>Olvidé mi contraseña</Text>
        {step === 1 ? (
          <>
            <Text style={styles.subtitle}>
              Ingresa tu email y te enviaremos un código de verificación.
            </Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestCode}
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
            <Text style={styles.subtitle}>
              Ingresa el código enviado a {email} y tu nueva contraseña.
            </Text>
            <Text style={styles.label}>Código</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
            <Text style={styles.label}>Nueva contraseña</Text>
            <PasswordInput
              inputStyle={styles.input}
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cambiar contraseña</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStep(1)}
              disabled={loading}>
              <Text style={styles.link}>Cambiar email</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={styles.backLink}>
          <Text style={styles.link}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', justifyContent: 'center'},
  content: {padding: 24},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
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
  link: {color: '#0066CC', textAlign: 'center', fontSize: 14},
  backLink: {marginTop: 8},
});
