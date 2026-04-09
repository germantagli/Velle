import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {adminApi} from '../../services/api';

export default function AdminDepositDetailScreen({route, navigation}: any): React.JSX.Element {
  const {depositId} = route.params as {depositId: string};
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const {data, refetch} = useQuery({
    queryKey: ['admin', 'deposit', depositId],
    queryFn: () => adminApi.getDeposit(depositId).then(r => r.data),
  });
  const deposit = data;

  const doApprove = async () => {
    setBusy(true);
    try {
      await adminApi.approveDeposit(depositId);
      await queryClient.invalidateQueries({queryKey: ['admin', 'deposits']});
      await refetch();
      Alert.alert('Listo', 'Depósito aprobado');
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await adminApi.rejectDeposit(depositId, reason);
      await queryClient.invalidateQueries({queryKey: ['admin', 'deposits']});
      await refetch();
      Alert.alert('Listo', 'Depósito rechazado');
    } finally {
      setBusy(false);
    }
  };

  if (!deposit) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Depósito {deposit.reference}</Text>
      <Text style={styles.row}>Estado: {deposit.status}</Text>
      <Text style={styles.row}>Usuario: {deposit.user?.email || '-'}</Text>
      <Text style={styles.row}>Monto solicitado: {deposit.amountRequested} VES</Text>
      <Text style={styles.row}>Monto exacto: {deposit.exactAmountToPay} VES</Text>
      <Text style={styles.row}>Teléfono pagador: {deposit.payerPhone || '-'}</Text>
      <Text style={styles.row}>Banco origen: {deposit.payerBank || '-'}</Text>
      <Text style={styles.row}>Referencia pagador: {deposit.payerReference || '-'}</Text>
      <Text style={styles.row}>Razón manual review: {deposit.manualReviewReason || '-'}</Text>
      <Text style={styles.row}>Respuesta mock banco:</Text>
      <Text style={styles.code}>{JSON.stringify((deposit as any).bankProviderResult || {}, null, 2)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Razón de rechazo (opcional)"
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity style={styles.approveBtn} disabled={busy} onPress={doApprove}>
        <Text style={styles.btnText}>Aprobar manualmente</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.rejectBtn} disabled={busy} onPress={doReject}>
        <Text style={styles.btnText}>Rechazar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12},
  row: {fontSize: 14, color: '#374151', marginBottom: 8},
  code: {
    fontSize: 12,
    color: '#111827',
    backgroundColor: '#e5e7eb',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  approveBtn: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  rejectBtn: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {color: '#fff', fontWeight: '700'},
  secondaryText: {color: '#374151', fontWeight: '600'},
});
