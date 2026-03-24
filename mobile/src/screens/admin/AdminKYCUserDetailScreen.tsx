import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Dimensions,
  Linking,
  Share,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import {API_URL} from '../../config';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {adminApi} from '../../services/api';

type RouteParams = {AdminKYCUserDetail: {userId: string}};

export default function AdminKYCUserDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<RouteParams, 'AdminKYCUserDetail'>>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const userId = route.params?.userId ?? '';

  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | string | null>(null);
  const [preview, setPreview] = useState<{url: string; label: string} | null>(null);
  const [rejectDoc, setRejectDoc] = useState<{id: string; label: string} | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const {data, isLoading, error, refetch} = useQuery({
    queryKey: ['admin', 'kyc', 'user', userId],
    queryFn: async () => {
      const res = await adminApi.getUserDocuments(userId);
      return res.data;
    },
    enabled: !!userId,
  });

  const handleApprove = () => {
    Alert.alert(
      'Aprobar KYC',
      '¿Confirmas que la documentación es válida y deseas aprobar este usuario?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Aprobar',
          onPress: async () => {
            setActionLoading('approve');
            try {
              await adminApi.approveKyc(userId);
              queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'pending']});
              Alert.alert('Aprobado', 'El KYC ha sido aprobado correctamente.', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (e: any) {
              Alert.alert(
                'Error',
                e.response?.data?.message || e.message || 'No se pudo aprobar',
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Rechazar KYC',
      '¿Confirmas que deseas rechazar toda la documentación de este usuario?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Rechazar todo',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('reject');
            try {
              await adminApi.rejectKyc(userId);
              queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'pending']});
              queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'user', userId]});
              Alert.alert('Rechazado', 'El KYC ha sido rechazado.', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (e: any) {
              Alert.alert(
                'Error',
                e.response?.data?.message || e.message || 'No se pudo rechazar',
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleApproveDocument = (docId: string, label: string) => {
    Alert.alert(
      'Aprobar documento',
      `¿Aprobar "${label}"?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Aprobar',
          onPress: async () => {
            setActionLoading(docId);
            try {
              const res = await adminApi.approveDocument(userId, docId);
              queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'pending']});
              queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'user', userId]});
              Alert.alert('Aprobado', res.data?.message || 'Documento aprobado.');
              if (res.data?.status === 'VERIFIED') {
                navigation.goBack();
              }
            } catch (e: any) {
              Alert.alert(
                'Error',
                e.response?.data?.message || e.message || 'No se pudo aprobar',
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleRejectDocument = (docId: string, label: string) => {
    setRejectDoc({id: docId, label});
    setRejectReason('');
  };

  const confirmRejectDocument = async () => {
    if (!rejectDoc) return;
    setActionLoading(rejectDoc.id);
    try {
      await adminApi.rejectDocument(userId, rejectDoc.id, rejectReason || undefined);
      queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'pending']});
      queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'user', userId]});
      setRejectDoc(null);
      Alert.alert(
        'Documento rechazado',
        'El usuario solo tendrá que volver a subir ese documento.',
      );
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || e.message || 'No se pudo rechazar',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openDocument = (url: string, label: string) => {
    let absUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      absUrl = url.startsWith('/') ? `${API_URL}${url}` : `${API_URL}/${url}`;
    }
    if (!absUrl.startsWith('http')) {
      Alert.alert('Error', 'URL de documento no disponible');
      return;
    }
    setPreview({url: absUrl, label});
  };

  const fallbackToBrowser = (url: string) => {
    setPreview(null);
    Linking.openURL(url).catch(() =>
      Alert.alert(
        'No se pudo abrir',
        '¿Compartir enlace?',
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Compartir',
            onPress: () =>
              Share.share({
                url,
                message: Platform.OS === 'android' ? url : undefined,
                title: 'Ver documento',
              }),
          },
        ],
      ),
    );
  };

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Usuario no especificado</Text>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Error al cargar'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {user, documents} = data as {
    user: {id: string; email: string; firstName: string; lastName: string; phone: string | null; kycStatus: string};
    documents: Array<{id: string; type: string; label: string; viewUrl: string; status: string; rejectionReason?: string | null}>;
  };

  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.phone ? (
          <Text style={styles.phone}>{user.phone}</Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Documentos</Text>
      <Text style={styles.sectionHint}>
        Aprobar o rechazar cada documento individualmente. Si rechazas uno, el usuario solo tendrá que volver a subirlo.
      </Text>
      {documents.length === 0 ? (
        <Text style={styles.emptyDocs}>No hay documentos subidos</Text>
      ) : (
        documents.map(doc => (
          <View key={doc.id} style={styles.docCard}>
            <TouchableOpacity
              style={styles.docCardTouchable}
              onPress={() => openDocument(doc.viewUrl, doc.label)}
              activeOpacity={0.7}>
              <Text style={styles.docLabel}>{doc.label}</Text>
              <Text style={styles.docType}>{doc.type}</Text>
              <View style={styles.docStatusRow}>
                <Text
                  style={[
                    styles.docStatus,
                    doc.status === 'VERIFIED' && styles.docStatusVerified,
                    doc.status === 'REJECTED' && styles.docStatusRejected,
                  ]}>
                  {doc.status === 'VERIFIED' ? '✓ Aprobado' : doc.status === 'REJECTED' ? '✗ Rechazado' : 'Pendiente'}
                </Text>
                <Text style={styles.docLink}>Ver documento →</Text>
              </View>
              {doc.status === 'REJECTED' && doc.rejectionReason ? (
                <Text style={styles.docRejectionReason}>{doc.rejectionReason}</Text>
              ) : null}
            </TouchableOpacity>
            {doc.status !== 'VERIFIED' && (
              <View style={styles.docActions}>
                <TouchableOpacity
                  style={[styles.docActionBtn, styles.docActionApprove]}
                  onPress={() => handleApproveDocument(doc.id, doc.label)}
                  disabled={!!actionLoading}>
                  {actionLoading === doc.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.docActionText}>Aprobar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.docActionBtn, styles.docActionReject]}
                  onPress={() => handleRejectDocument(doc.id, doc.label)}
                  disabled={!!actionLoading}>
                  <Text style={styles.docActionText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <Modal
        visible={!!rejectDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectDoc(null)}>
        <KeyboardAvoidingView
          style={styles.rejectModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setRejectDoc(null)}
          />
          <View style={styles.rejectModalContent} pointerEvents="box-none">
            <Text style={styles.rejectModalTitle}>
              Rechazar: {rejectDoc?.label}
            </Text>
            <Text style={styles.rejectModalHint}>
              Motivo (opcional). El usuario solo tendrá que volver a subir este documento.
            </Text>
            <TextInput
              style={styles.rejectReasonInput}
              placeholder="Ej: Foto borrosa, documento vencido..."
              placeholderTextColor="#999"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={[styles.rejectModalBtn, styles.rejectModalCancel]}
                onPress={() => setRejectDoc(null)}>
                <Text style={styles.rejectModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectModalBtn, styles.rejectModalConfirm]}
                onPress={confirmRejectDocument}
                disabled={!!actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.rejectModalConfirmText}>Rechazar documento</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreview(null)}>
          <View style={styles.modalContent} pointerEvents="box-none">
            {preview && (
              <>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {preview.label}
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={e => e.stopPropagation()}>
                  <Image
                    source={{uri: preview.url}}
                    style={styles.previewImage}
                    resizeMode="contain"
                    onError={() => fallbackToBrowser(preview.url)}
                  />
                </TouchableOpacity>
                <Text style={styles.modalHint}>Toca fuera para cerrar</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.btn,
            styles.btnApprove,
            (!!actionLoading ||
              documents.some(
                d => d.status === 'REJECTED' || d.status === 'PENDING',
              )) &&
              styles.buttonDisabled,
          ]}
          onPress={handleApprove}
          disabled={
            !!actionLoading ||
            documents.some(d => d.status === 'REJECTED' || d.status === 'PENDING')
          }>
          {actionLoading === 'approve' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Aprobar KYC</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnReject]}
          onPress={handleReject}
          disabled={!!actionLoading}>
          {actionLoading === 'reject' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Rechazar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {fontSize: 28, color: '#fff', fontWeight: 'bold'},
  name: {fontSize: 18, fontWeight: 'bold', marginTop: 12, color: '#1a1a2e'},
  email: {fontSize: 14, color: '#666', marginTop: 4},
  phone: {fontSize: 13, color: '#888', marginTop: 2},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  docCardTouchable: {marginBottom: 0},
  docLabel: {fontSize: 15, fontWeight: '600', color: '#1a1a2e'},
  docType: {fontSize: 12, color: '#666', marginTop: 2},
  docStatusRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8},
  docStatus: {fontSize: 12, color: '#666'},
  docStatusVerified: {color: '#16a34a', fontWeight: '600'},
  docStatusRejected: {color: '#dc2626', fontWeight: '600'},
  docRejectionReason: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 6,
    fontStyle: 'italic',
  },
  docLink: {fontSize: 13, color: '#0066CC', fontWeight: '500'},
  docActions: {flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee'},
  docActionBtn: {flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center'},
  docActionApprove: {backgroundColor: '#16a34a'},
  docActionReject: {backgroundColor: '#dc2626'},
  docActionText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  emptyDocs: {fontSize: 14, color: '#888', fontStyle: 'italic', marginBottom: 20},
  actions: {marginTop: 24, gap: 12},
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnApprove: {backgroundColor: '#16a34a'},
  btnReject: {backgroundColor: '#dc2626'},
  buttonDisabled: {opacity: 0.5},
  btnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  errorText: {fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewImage: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height * 0.65,
    maxWidth: 500,
  },
  modalHint: {
    color: '#999',
    fontSize: 13,
    marginTop: 12,
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  rejectModalHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  rejectModalActions: {flexDirection: 'row', gap: 12},
  rejectModalBtn: {flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center'},
  rejectModalCancel: {backgroundColor: '#f0f0f0'},
  rejectModalCancelText: {color: '#333', fontSize: 16, fontWeight: '600'},
  rejectModalConfirm: {backgroundColor: '#dc2626'},
  rejectModalConfirmText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '600'},
});
