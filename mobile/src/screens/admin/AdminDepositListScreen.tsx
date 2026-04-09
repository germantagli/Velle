import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {adminApi} from '../../services/api';

const FILTERS = [
  'PENDING_PAYMENT',
  'VERIFICATION_PENDING',
  'MANUAL_REVIEW',
  'CONFIRMED',
  'REJECTED',
  'EXPIRED',
];

export default function AdminDepositListScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<string>('MANUAL_REVIEW');
  const {data, refetch} = useQuery({
    queryKey: ['admin', 'deposits', status],
    queryFn: () => adminApi.listDeposits(status).then(r => r.data),
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch().catch(() => {});
    }, [refetch]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.filters}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, status === f && styles.filterBtnActive]}
                onPress={() => setStatus(f)}>
                <Text style={[styles.filterText, status === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('AdminDepositDetail', {depositId: item.id})}>
            <Text style={styles.title}>
              {(item.user?.firstName || '') + ' ' + (item.user?.lastName || '')}
            </Text>
            <Text style={styles.meta}>
              {Number(item.exactAmountToPay).toLocaleString('es-VE', {minimumFractionDigits: 2})} VES · {item.status}
            </Text>
            <Text style={styles.meta}>{item.reference}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  filters: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12},
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  filterBtnActive: {backgroundColor: '#0d9488'},
  filterText: {fontSize: 12, color: '#111827'},
  filterTextActive: {color: '#fff', fontWeight: '700'},
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
  },
  title: {fontSize: 15, fontWeight: '700', color: '#111827'},
  meta: {fontSize: 12, color: '#4b5563', marginTop: 4},
});
