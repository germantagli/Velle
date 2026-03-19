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

  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [preview, setPreview] = useState<{url: string; label: string} | null>(null);

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
      '¿Confirmas que deseas rechazar la documentación de este usuario?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('reject');
            try {
              await adminApi.rejectKyc(userId);
              queryClient.invalidateQueries({queryKey: ['admin', 'kyc', 'pending']});
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
    documents: Array<{id: string; type: string; label: string; viewUrl: string; status: string}>;
  };

  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
      {documents.length === 0 ? (
        <Text style={styles.emptyDocs}>No hay documentos subidos</Text>
      ) : (
        documents.map(doc => (
          <TouchableOpacity
            key={doc.id}
            style={styles.docCard}
            onPress={() => openDocument(doc.viewUrl, doc.label)}
            activeOpacity={0.7}>
            <Text style={styles.docLabel}>{doc.label}</Text>
            <Text style={styles.docType}>{doc.type}</Text>
            <Text style={styles.docLink}>Tocar para ver →</Text>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnApprove]}
          onPress={handleApprove}
          disabled={!!actionLoading}>
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
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  docLabel: {fontSize: 15, fontWeight: '600', color: '#1a1a2e'},
  docType: {fontSize: 12, color: '#666', marginTop: 2},
  docLink: {fontSize: 13, color: '#0066CC', marginTop: 6, fontWeight: '500'},
  emptyDocs: {fontSize: 14, color: '#888', fontStyle: 'italic', marginBottom: 20},
  actions: {marginTop: 24, gap: 12},
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnApprove: {backgroundColor: '#16a34a'},
  btnReject: {backgroundColor: '#dc2626'},
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
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '600'},
});
