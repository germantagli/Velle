import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';

export default function MFAScreen({navigation}: any): React.JSX.Element {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyMfa(code);
      setAuth({needsMFA: false});
      navigation.replace('Main');
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Código inválido';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificación en dos pasos</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de 6 dígitos de tu app de autenticación
      </Text>
      <TextInput
        style={styles.input}
        placeholder="000000"
        value={code}
        onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verificar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff'},
  title: {fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e'},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 24},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
