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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAuthStore} from '../../store/authStore';
import {userApi} from '../../services/api';
import {kycApi} from '../../services/api';

const DOC_TYPES = [
  {key: 'id_front', label: 'Cédula - Frente'},
  {key: 'id_back', label: 'Cédula - Reverso'},
  {key: 'selfie', label: 'Selfie con documento'},
  {key: 'proof_of_address', label: 'Comprobante de domicilio'},
];

export default function KYCScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [docNumber, setDocNumber] = useState('');
  const [address, setAddress] = useState('');
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const insets = useSafeAreaInsets();

  const markUploaded = (type: string) => {
    setUploaded(prev => ({...prev, [type]: true}));
  };

  const handleSubmit = async () => {
    if (!docNumber.trim()) {
      Alert.alert('Error', 'Ingresa tu número de documento');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Ingresa tu dirección');
      return;
    }
    const missing = DOC_TYPES.filter(d => !uploaded[d.key]);
    if (missing.length > 0) {
      Alert.alert('Error', `Faltan documentos: ${missing.map(m => m.label).join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      await kycApi.submit(
        DOC_TYPES.map(d => ({
          type: d.key,
          url: `uploaded://${d.key}`, // En producción: URL de S3 tras subir
        })),
      );
      setAuth({
        user: useAuthStore.getState().user
          ? {...useAuthStore.getState().user!, kycStatus: 'UNDER_REVIEW'}
          : undefined,
      });
      Alert.alert('Éxito', 'Documentos enviados. Recibirás notificación cuando se verifiquen.');
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al enviar documentos';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}>
        <Text style={styles.title}>Verificación KYC</Text>
        <Text style={styles.subtitle}>
          Requerido por regulación. Tus datos están protegidos y encriptados.
        </Text>
        <Text style={styles.label}>Número de cédula o pasaporte</Text>
        <TextInput
          style={styles.input}
          placeholder="V-12345678"
          value={docNumber}
          onChangeText={setDocNumber}
          editable={!loading}
        />
        <Text style={styles.label}>Dirección de domicilio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Calle, número, ciudad, estado"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
        <Text style={styles.sectionTitle}>Documentos requeridos</Text>
        {DOC_TYPES.map(d => (
          <TouchableOpacity
            key={d.key}
            style={[styles.docBtn, uploaded[d.key] && styles.docBtnDone]}
            onPress={() => {
              Alert.alert(
                'Subir documento',
                `Abre la cámara para ${d.label}`,
                [
                  {text: 'Cancelar', style: 'cancel'},
                  {text: 'Simular subida', onPress: () => markUploaded(d.key)},
                ],
              );
            }}
            disabled={loading}>
            <Text style={styles.docBtnText}>
              {uploaded[d.key] ? '✓ ' : ''}{d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View
        style={[
          styles.buttonBar,
          {paddingBottom: Math.max(insets.bottom, 24)},
        ]}>
        <TouchableOpacity
          style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonPrimaryText}>Enviar verificación</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, loading && styles.buttonDisabled]}
          onPress={async () => {
            setLoading(true);
            try {
              await userApi.skipKyc();
              const user = useAuthStore.getState().user;
              if (user)
                useAuthStore.getState().setAuth({
                  user: {...user, kycSkipped: true},
                });
              navigation.replace('Main');
            } catch {
              Alert.alert('Error', 'No se pudo omitir. Intenta de nuevo.');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          activeOpacity={0.7}>
          <Text style={styles.buttonSecondaryText}>Omitir por ahora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  scroll: {flex: 1},
  scrollContent: {padding: 24, paddingBottom: 24},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e'},
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
  textArea: {minHeight: 80, textAlignVertical: 'top'},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  docBtn: {
    borderWidth: 2,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  docBtnDone: {borderColor: '#22c55e', backgroundColor: '#f0fdf4'},
  docBtnText: {color: '#0066CC', fontSize: 14},
  buttonBar: {
    flexDirection: 'column',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  buttonPrimary: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonSecondary: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  buttonDisabled: {opacity: 0.7},
  buttonPrimaryText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  buttonSecondaryText: {color: '#0066CC', fontSize: 16, fontWeight: '600'},
});
