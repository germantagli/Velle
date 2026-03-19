import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {launchCamera} from 'react-native-image-picker';
import {useAuthStore} from '../../store/authStore';
import {userApi} from '../../services/api';
import {kycApi} from '../../services/api';

const DOC_TYPES = [
  {key: 'id_front', label: 'DNI, cédula o pasaporte'},
  {key: 'selfie', label: 'Selfie con documento'},
  {key: 'proof_of_address', label: 'Comprobante de domicilio'},
] as const;

export default function KYCScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkKycStatus();
  }, []);

  const checkKycStatus = async () => {
    setLoading(true);
    try {
      const {data} = await kycApi.getStatus();
      if (data.status === 'VERIFIED') {
        const user = useAuthStore.getState().user;
        if (user)
          setAuth({
            user: {...user, kycStatus: 'VERIFIED'},
          });
        navigation.replace('Main');
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const captureAndUpload = async (type: string) => {
    setUploadingDoc(type);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permiso de cámara',
            message: 'Velle necesita acceso a la cámara para capturar documentos.',
            buttonPositive: 'Permitir',
            buttonNegative: 'Cancelar',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permiso requerido',
            'Necesitas permitir el acceso a la cámara para capturar documentos.',
          );
          setUploadingDoc(null);
          return;
        }
      }

      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: false,
        quality: 0.7,
      });

      if (result.errorCode) {
        const msg =
          result.errorMessage ||
          (result.errorCode === 'camera_unavailable'
            ? 'No se encontró cámara en el dispositivo.'
            : 'No se pudo abrir la cámara.');
        Alert.alert('Error', msg);
        setUploadingDoc(null);
        return;
      }

      if (result.didCancel || !result.assets?.[0]?.uri) {
        setUploadingDoc(null);
        return;
      }
      const asset = result.assets[0];
      const uri = Platform.OS === 'android' ? asset.uri : asset.uri;
      if (!uri) return;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `kyc-${type}-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const data = await kycApi.uploadDocument(type, formData);
      setUploadedDocs(prev => ({...prev, [type]: data.url}));
    } catch (e: any) {
      let msg = e.message || 'Error al subir';
      if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
        msg =
          'No se pudo conectar. Verifica tu conexión a internet y que el backend esté activo.';
      }
      if (__DEV__) {
        console.warn('KYC upload error:', e);
      }
      Alert.alert('Error', msg);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmitManual = async () => {
    const missing = DOC_TYPES.filter(d => !uploadedDocs[d.key]);
    if (missing.length > 0) {
      Alert.alert(
        'Documentos incompletos',
        `Faltan: ${missing.map(m => m.label).join(', ')}`,
      );
      return;
    }
    setSubmitting(true);
    try {
      await kycApi.submit(
        DOC_TYPES.map(d => ({type: d.key, url: uploadedDocs[d.key]})),
      );
      const user = useAuthStore.getState().user;
      if (user)
        setAuth({
          user: {...user, kycStatus: 'UNDER_REVIEW'},
        });
      Alert.alert(
        'Documentos enviados',
        'Recibirás notificación cuando se complete la verificación.',
        [{text: 'Continuar', onPress: () => navigation.replace('Main')}],
      );
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error al enviar';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, {paddingTop: insets.top + 24}]}>
        <Text style={styles.title}>Verificación de identidad</Text>
        <Text style={styles.subtitle}>
          Requerido por regulación. Verificamos tu identidad de forma automatizada
          para proteger tu cuenta.
        </Text>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Subir documentos</Text>
            <Text style={styles.cardDesc}>
              Captura con la cámara cada documento requerido. Los enviaremos para
              verificación.
            </Text>
            {DOC_TYPES.map(d => (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.docBtn,
                  uploadedDocs[d.key] && styles.docBtnDone,
                  uploadingDoc === d.key && styles.buttonDisabled,
                ]}
                onPress={() => captureAndUpload(d.key)}
                disabled={!!uploadingDoc}>
                <Text style={styles.docBtnText}>
                  {uploadedDocs[d.key] ? '✓ ' : ''}{d.label}
                </Text>
                {uploadingDoc === d.key && (
                  <ActivityIndicator
                    size="small"
                    color="#0066CC"
                    style={styles.docSpinner}
                  />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.buttonPrimary,
                (submitting ||
                  Object.keys(uploadedDocs).length < DOC_TYPES.length) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSubmitManual}
              disabled={
                submitting ||
                Object.keys(uploadedDocs).length < DOC_TYPES.length
              }>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Enviar verificación</Text>
              )}
            </TouchableOpacity>
          </View>

        <TouchableOpacity
          style={[styles.buttonSecondary, submitting && styles.buttonDisabled]}
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
          disabled={submitting}
          activeOpacity={0.7}>
          <Text style={styles.buttonSecondaryText}>Omitir por ahora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  centered: {justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 12, color: '#666'},
  content: {flex: 1, padding: 24},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e'},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 22},
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#1a1a2e'},
  cardDesc: {fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 22},
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
  docSpinner: {marginTop: 8},
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
    minHeight: 52,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  buttonDisabled: {opacity: 0.7},
  buttonPrimaryText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  buttonSecondaryText: {color: '#0066CC', fontSize: 16, fontWeight: '600'},
});
