import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import WebView from 'react-native-webview';
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
  const [sumsubReady, setSumsubReady] = useState(false);
  const [showSumsub, setShowSumsub] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
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
      setSumsubReady(!!data.sumsubConfigured);
    } catch {
      setSumsubReady(false);
    } finally {
      setLoading(false);
    }
  };

  const captureAndUpload = async (type: string) => {
    setUploadingDoc(type);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: false,
      });
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

      const {data} = await kycApi.uploadDocument(type, formData);
      setUploadedDocs(prev => ({...prev, [type]: data.url}));
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error al subir';
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

  const startSumsubVerification = async () => {
    setVerifying(true);
    try {
      const {data} = await kycApi.initVerification();
      if (data.status === 'VERIFIED') {
        const user = useAuthStore.getState().user;
        if (user)
          setAuth({
            user: {...user, kycStatus: 'VERIFIED'},
          });
        navigation.replace('Main');
        return;
      }
      if (!data.accessToken) {
        Alert.alert(
          'Error',
          data.message || 'No se pudo iniciar la verificación. Intenta más tarde.',
        );
        return;
      }
      setAccessToken(data.accessToken);
      setShowSumsub(true);
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al iniciar verificación';
      Alert.alert('Error', msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleSumsubMessage = (event: {nativeEvent: {data: string}}) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const {type} = data;
      if (type === 'idCheck.applicantStatus' || type === 'idCheck.applicantLoaded') {
        const status = data.payload?.reviewStatus ?? data.payload?.reviewResult?.reviewStatus;
        if (status === 'completed' || status === 'GREEN') {
          setShowSumsub(false);
          const user = useAuthStore.getState().user;
          if (user)
            setAuth({
              user: {...user, kycStatus: 'VERIFIED'},
            });
          Alert.alert(
            'Verificación completada',
            'Tu identidad ha sido verificada correctamente.',
            [{text: 'Continuar', onPress: () => navigation.replace('Main')}],
          );
        }
      }
      if (type === 'idCheck.applicantSubmitted') {
        setShowSumsub(false);
        const user = useAuthStore.getState().user;
        if (user)
          setAuth({
            user: {...user, kycStatus: 'UNDER_REVIEW'},
          });
        Alert.alert(
          'Documentos enviados',
          'Recibirás una notificación cuando se complete la verificación.',
          [{text: 'Continuar', onPress: () => navigation.replace('Main')}],
        );
      }
    } catch {
      // ignore parse errors
    }
  };

  const handleSumsubClose = () => {
    setShowSumsub(false);
    setAccessToken(null);
    checkKycStatus();
  };

  const getSumsubHtml = () => {
    if (!accessToken) return '';
    const token = accessToken.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '');
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js"></script>
</head>
<body style="margin:0;padding:0;">
  <div id="sumsub-container" style="width:100%;height:100vh;"></div>
  <script>
    (function() {
      var token = "${token}";
      try {
        var snsWebSdkInstance = snsWebSdk
          .init(token, function() { return Promise.resolve(token); })
          .withConf({ lang: 'es' })
          .withOptions({ addViewportTag: false })
          .on('idCheck.onStepCompleted', function(payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'idCheck.onStepCompleted',
              payload: payload
            }));
          })
          .on('idCheck.applicantStatus', function(payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'idCheck.applicantStatus',
              payload: payload
            }));
          })
          .on('idCheck.applicantSubmitted', function(payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'idCheck.applicantSubmitted',
              payload: payload
            }));
          })
          .on('idCheck.applicantLoaded', function(payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'idCheck.applicantLoaded',
              payload: payload
            }));
          })
          .on('error', function(error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              error: error
            }));
          })
          .build();
        snsWebSdkInstance.launch('#sumsub-container');
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          error: String(e)
        }));
      }
    })();
  </script>
</body>
</html>
    `;
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

        {sumsubReady ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verificación automatizada</Text>
            <Text style={styles.cardDesc}>
              Captura tu documento (DNI, cédula o pasaporte), toma una selfie con
              verificación en vivo y listo. Sin esperas ni revisión manual.
            </Text>
            <TouchableOpacity
              style={[styles.buttonPrimary, verifying && styles.buttonDisabled]}
              onPress={startSumsubVerification}
              disabled={verifying}>
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Iniciar verificación</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
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
        )}

        <TouchableOpacity
          style={[styles.buttonSecondary, verifying && styles.buttonDisabled]}
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
          disabled={verifying}
          activeOpacity={0.7}>
          <Text style={styles.buttonSecondaryText}>Omitir por ahora</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSumsub}
        animationType="slide"
        onRequestClose={handleSumsubClose}>
        <View style={[styles.modalContainer, {paddingTop: insets.top}]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleSumsubClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{html: getSumsubHtml()}}
            style={styles.webview}
            onMessage={handleSumsubMessage}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mixedContentMode="always"
          />
        </View>
      </Modal>
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
  modalContainer: {flex: 1, backgroundColor: '#fff'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeBtn: {padding: 8},
  closeBtnText: {color: '#0066CC', fontSize: 16, fontWeight: '600'},
  webview: {flex: 1},
});
