import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {walletApi, TransactionItem} from '../../services/api';

const TYPE_LABELS: Record<string, string> = {
  P2P: 'Transferencia P2P (USDT)',
  P2P_VES: 'Transferencia P2P (VES)',
  ZELLE_IN: 'Depósito Zelle',
  ZELLE_OUT: 'Envío Zelle',
  MERCHANT_PAY: 'Pago comercio',
  CARD_PAYMENT: 'Pago tarjeta',
  VES_DEPOSIT: 'Depósito VES',
  WITHDRAWAL: 'Retiro',
  USA_BANK_WITHDRAWAL: 'Retiro USA',
  CONVERSION_VES_TO_USDT: 'Conversión VES → USDT',
  CONVERSION_USDT_TO_VES: 'Conversión USDT → VES',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#22c55e',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  CANCELLED: '#6b7280',
};

export default function HistoryScreen(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const navigation = useNavigation<any>();

  const {data, isLoading, refetch, isFetching} = useQuery({
    queryKey: ['wallet', 'transactions', page],
    queryFn: () =>
      walletApi.getTransactions({page, limit: 20}).then(r => r.data),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = items.length < total;

  const renderItem = ({item}: {item: TransactionItem}) => {
    const isIncoming =
      item.type === 'ZELLE_IN' ||
      item.type === 'VES_DEPOSIT' ||
      (item.type === 'P2P' && item.metadata?.direction === 'in') ||
      (item.type === 'P2P_VES' && item.metadata?.direction === 'in') ||
      item.type === 'CONVERSION_USDT_TO_VES';
    const isConversion = item.type.startsWith('CONVERSION');
    const amount = parseFloat(item.amount);
    const sign = isConversion ? '' : isIncoming ? '+' : '-';
    const currency = item.currency ?? 'USDT';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('TransactionDetail', {id: item.id})}
        activeOpacity={0.7}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemType}>
            {TYPE_LABELS[item.type] ?? item.type}
          </Text>
          <Text style={styles.itemDate}>
            {new Date(item.createdAt).toLocaleDateString('es-VE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text
            style={[
              styles.itemAmount,
              {
                color: isConversion
                  ? '#0d9488'
                  : isIncoming
                    ? '#22c55e'
                    : '#1a1a2e',
              },
            ]}>
            {sign}{' '}
            {amount.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}{' '}
            {currency}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: `${STATUS_COLORS[item.status] ?? '#6b7280'}20`},
            ]}>
            <Text
              style={[
                styles.statusText,
                {color: STATUS_COLORS[item.status] ?? '#6b7280'},
              ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color="#0066CC" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sin transacciones</Text>
            </View>
          )
        }
        onEndReached={() => hasMore && !isFetching && setPage(p => p + 1)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  list: {padding: 16, paddingBottom: 32},
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLeft: {flex: 1},
  itemType: {fontSize: 16, fontWeight: '600', color: '#333'},
  itemDate: {fontSize: 12, color: '#666', marginTop: 4},
  itemRight: {alignItems: 'flex-end'},
  itemAmount: {fontSize: 16, fontWeight: '600'},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {fontSize: 11, fontWeight: '600'},
  empty: {padding: 48, alignItems: 'center'},
  emptyText: {fontSize: 16, color: '#666'},
});
