import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';

type Step = 'status' | 'setup' | 'enable' | 'disable';

export default function TwoFAScreen({navigation}: any): React.JSX.Element {
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);
  const mfaEnabled = user?.mfaEnabled ?? false;

  const [step, setStep] = useState<Step>('status');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const {data} = await authApi.setupMfa();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('enable');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Error al configurar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      await authApi.enableMfa(code);
      setAuth({user: {...user!, mfaEnabled: true}});
      Alert.alert('Éxito', '2FA activado correctamente', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    Alert.alert(
      'Desactivar 2FA',
      '¿Estás seguro? Tu cuenta será menos segura.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Desactivar', style: 'destructive', onPress: () => setStep('disable')},
      ],
    );
  };

  const handleDisableConfirm = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresa tu código actual de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      await authApi.disableMfa(code);
      setAuth({user: {...user!, mfaEnabled: false}});
      Alert.alert('Éxito', '2FA desactivado', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'status') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.statusCard, mfaEnabled && styles.statusEnabled]}>
          <Text style={styles.statusEmoji}>{mfaEnabled ? '🔒' : '🔓'}</Text>
          <Text style={styles.statusTitle}>
            {mfaEnabled ? '2FA activado' : '2FA desactivado'}
          </Text>
          <Text style={styles.statusDesc}>
            {mfaEnabled
              ? 'Tu cuenta está protegida con verificación en dos pasos.'
              : 'Activa la verificación en dos pasos para mayor seguridad.'}
          </Text>
        </View>
        {mfaEnabled ? (
          <TouchableOpacity
            style={styles.disableBtn}
            onPress={handleDisable}>
            <Text style={styles.disableBtnText}>Desactivar 2FA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSetup}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Activar 2FA</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  if (step === 'enable') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configurar 2FA</Text>
        <Text style={styles.subtitle}>
          1. Abre una app de autenticación (Google Authenticator, Authy, etc.)
        </Text>
        <Text style={styles.subtitle}>
          2. Escanea el QR o ingresa este código manualmente:
        </Text>
        {secret && (
          <View style={styles.secretBox}>
            <Text style={styles.secretText} selectable>
              {secret}
            </Text>
          </View>
        )}
        <Text style={styles.subtitle}>3. Ingresa el código de 6 dígitos:</Text>
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
          onPress={handleEnable}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar y activar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'disable') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Desactivar 2FA</Text>
        <Text style={styles.subtitle}>
          Ingresa tu código actual de la app de autenticación para confirmar:
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
          onPress={handleDisableConfirm}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Desactivar 2FA</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setStep('status')}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 24},
  statusCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusEnabled: {backgroundColor: '#d1fae5'},
  statusEmoji: {fontSize: 40, marginBottom: 12},
  statusTitle: {fontSize: 18, fontWeight: 'bold', color: '#1a1a2e'},
  statusDesc: {fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center'},
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  disableBtn: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
  },
  disableBtnText: {fontSize: 16, fontWeight: '600', color: '#ef4444'},
  title: {fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 12},
  secretBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secretText: {fontSize: 14, fontFamily: 'monospace'},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  cancelBtn: {padding: 12, alignItems: 'center'},
  cancelBtnText: {fontSize: 15, color: '#666'},
});
