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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {authApi} from '../../services/api';

export default function SecurityScreen({navigation}: any): React.JSX.Element {
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const needsInitialPassword = user && (user as any).passwordSet === false;

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (!needsInitialPassword && !currentPassword) {
      Alert.alert('Error', 'Ingresa tu contraseña actual');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(
        needsInitialPassword ? undefined : currentPassword,
        newPassword,
      );
      if (user) setAuth({user: {...user, passwordSet: true} as any});
      Alert.alert('Éxito', 'Contraseña actualizada', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al cambiar contraseña';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>
          {needsInitialPassword ? 'Definir contraseña' : 'Cambiar contraseña'}
        </Text>
        {!needsInitialPassword && (
          <>
            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Tu contraseña actual"
              secureTextEntry
              editable={!loading}
            />
          </>
        )}
        <Text style={styles.label}>
          {needsInitialPassword ? 'Contraseña' : 'Nueva contraseña'}
        </Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          editable={!loading}
        />
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repite la contraseña"
          secureTextEntry
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Actualizar contraseña</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('TwoFA')}>
          <Text style={styles.linkBtnText}>Configurar verificación en dos pasos (2FA) ›</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 24},
  sectionTitle: {fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  linkBtn: {paddingVertical: 12},
  linkBtnText: {fontSize: 15, color: '#0066CC', fontWeight: '500'},
});
