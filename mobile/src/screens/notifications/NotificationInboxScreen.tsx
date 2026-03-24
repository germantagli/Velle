import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {useAuthStore} from '../../store/authStore';
import {notificationApi, NotificationItem} from '../../services/api';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return d.toLocaleTimeString('es-VE', {hour: '2-digit', minute: '2-digit'});
    if (diff < 604800000)
      return d.toLocaleDateString('es-VE', {weekday: 'short', hour: '2-digit', minute: '2-digit'});
    return d.toLocaleDateString('es-VE', {day: '2-digit', month: 'short', year: 'numeric'});
  } catch {
    return iso;
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'KYC_APPROVED':
    case 'KYC_DOCUMENT_APPROVED':
      return '✓';
    case 'KYC_REJECTED':
    case 'KYC_DOCUMENT_REJECTED':
      return '✗';
    case 'KYC_SUBMITTED':
      return '📄';
    default:
      return '•';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'KYC_APPROVED':
    case 'KYC_DOCUMENT_APPROVED':
      return '#16a34a';
    case 'KYC_REJECTED':
    case 'KYC_DOCUMENT_REJECTED':
      return '#dc2626';
    case 'KYC_SUBMITTED':
      return '#0066CC';
    default:
      return '#666';
  }
}

export default function NotificationInboxScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.isAdmin ?? false;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {data, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list(100);
      return res.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['notifications']}),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['notifications']}),
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handlePress = (item: NotificationItem) => {
    setExpandedId(prev => (prev === item.id ? null : item.id));
    if (!item.readAt) {
      markReadMutation.mutate(item.id);
    }
    if (isAdmin && item.type === 'KYC_SUBMITTED' && item.metadata?.userId) {
      const tabNav = navigation.getParent();
      (tabNav as any)?.navigate?.('Perfil', {
        screen: 'AdminKYCUserDetail',
        params: {userId: item.metadata.userId as string},
      });
    }
  };

  const renderItem = ({item}: {item: NotificationItem}) => {
    const isExpanded = expandedId === item.id;
    const isUnread = !item.readAt;
    const icon = getTypeIcon(item.type);
    const color = getTypeColor(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isUnread && styles.cardUnread,
          isExpanded && styles.cardExpanded,
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, {backgroundColor: color + '20'}]}>
            <Text style={[styles.iconText, {color}]}>{icon}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Text
          style={styles.body}
          numberOfLines={isExpanded ? undefined : 2}>
          {item.body}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.toolbar}>
          <Text style={styles.unreadText}>
            {unreadCount} sin leer
          </Text>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}>
            <Text style={styles.markAllText}>Marcar todo como leído</Text>
          </TouchableOpacity>
        </View>
      )}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>
            Aquí aparecerán las notificaciones sobre tu KYC y revisión de documentos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  centered: {justifyContent: 'center', alignItems: 'center'},
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unreadText: {fontSize: 13, color: '#666'},
  markAllBtn: {paddingVertical: 4, paddingHorizontal: 8},
  markAllText: {fontSize: 14, color: '#0066CC', fontWeight: '600'},
  list: {padding: 16, paddingBottom: 32},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  cardExpanded: {
    borderColor: '#0066CC',
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {fontSize: 18, fontWeight: 'bold'},
  cardHeaderText: {flex: 1},
  title: {fontSize: 16, fontWeight: '600', color: '#1a1a2e'},
  date: {fontSize: 12, color: '#888', marginTop: 2},
  body: {fontSize: 14, color: '#555', lineHeight: 22},
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8},
  emptyText: {fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22},
});
