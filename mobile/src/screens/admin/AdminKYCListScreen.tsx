import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {adminApi} from '../../services/api';

type PendingUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  kycStatus: string;
  documentCount: number;
  createdAt: string;
};

export default function AdminKYCListScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: async () => {
      const res = await adminApi.listPendingKyc();
      return res.data;
    },
  });

  const users = (data?.users ?? []) as PendingUser[];

  if (error) {
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

  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const renderItem = ({item}: {item: PendingUser}) => {
    const name = `${item.firstName} ${item.lastName}`.trim() || item.email;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AdminKYCUserDetail', {userId: item.id})}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.cardEmail}>{item.email}</Text>
            <Text style={styles.cardMeta}>
              {item.documentCount} documento(s) · {formatDate(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay documentos pendientes de revisión</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !!data}
              onRefresh={refetch}
              colors={['#0066CC']}
            />
          }
        />
      )}
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  list: {padding: 16, paddingBottom: 32},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center'},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {fontSize: 20, color: '#fff', fontWeight: 'bold'},
  cardInfo: {flex: 1, marginLeft: 12},
  cardName: {fontSize: 16, fontWeight: '600', color: '#1a1a2e'},
  cardEmail: {fontSize: 13, color: '#666', marginTop: 2},
  cardMeta: {fontSize: 12, color: '#999', marginTop: 4},
  arrow: {fontSize: 22, color: '#999'},
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {fontSize: 16, color: '#666', textAlign: 'center'},
  errorText: {fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16},
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '600'},
});
