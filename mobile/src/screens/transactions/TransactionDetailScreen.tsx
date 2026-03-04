import React from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {walletApi} from '../../services/api';

const TYPE_LABELS: Record<string, string> = {
  P2P: 'Transferencia P2P',
  ZELLE_IN: 'Depósito Zelle',
  ZELLE_OUT: 'Envío Zelle',
  MERCHANT_PAY: 'Pago comercio',
  CARD_PAYMENT: 'Pago tarjeta',
  VES_DEPOSIT: 'Depósito VES',
  WITHDRAWAL: 'Retiro',
};

export default function TransactionDetailScreen({route}: any): React.JSX.Element {
  const {id} = route.params;

  const {data, isLoading} = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => walletApi.getTransaction(id).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.error}>
        <Text>Transacción no encontrada</Text>
      </View>
    );
  }

  const tx = data as any;
  const isIncoming =
    tx.type === 'ZELLE_IN' ||
    tx.type === 'VES_DEPOSIT' ||
    (tx.type === 'P2P' && tx.metadata?.direction === 'in');
  const amount = parseFloat(tx.amount);
  const sign = isIncoming ? '+' : '-';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.amountCard}>
        <Text style={styles.typeLabel}>{TYPE_LABELS[tx.type] ?? tx.type}</Text>
        <Text
          style={[
            styles.amount,
            {color: isIncoming ? '#22c55e' : '#1a1a2e'},
          ]}>
          {sign} {amount.toFixed(2)} USDT
        </Text>
        <View
          style={[
            styles.statusBadge,
            tx.status === 'COMPLETED' && styles.statusCompleted,
            tx.status === 'PENDING' && styles.statusPending,
            tx.status === 'FAILED' && styles.statusFailed,
          ]}>
          <Text style={styles.statusText}>{tx.status}</Text>
        </View>
      </View>
      <View style={styles.details}>
        <Row label="Fecha" value={
          new Date(tx.createdAt).toLocaleString('es-VE', {
            dateStyle: 'long',
            timeStyle: 'short',
          })
        } />
        {tx.fee > 0 && (
          <Row label="Comisión" value={`${parseFloat(tx.fee)} USDT`} />
        )}
        {tx.externalRef && (
          <Row label="Referencia" value={tx.externalRef} />
        )}
        {tx.metadata && Object.keys(tx.metadata).length > 0 && (
          <Row label="Detalles" value={JSON.stringify(tx.metadata)} />
        )}
      </View>
    </ScrollView>
  );
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24},
  loading: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  error: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  amountCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  typeLabel: {fontSize: 14, color: '#666', marginBottom: 8},
  amount: {fontSize: 28, fontWeight: 'bold'},
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  statusCompleted: {backgroundColor: '#d1fae5'},
  statusPending: {backgroundColor: '#fef3c7'},
  statusFailed: {backgroundColor: '#fee2e2'},
  statusText: {fontSize: 12, fontWeight: '600'},
  details: {gap: 16},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {fontSize: 14, color: '#666'},
  rowValue: {fontSize: 14, fontWeight: '500', flex: 1, marginLeft: 16, textAlign: 'right'},
});
