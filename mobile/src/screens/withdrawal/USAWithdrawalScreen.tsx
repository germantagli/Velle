import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  walletApi,
  limitsApi,
  bankAccountApi,
  withdrawalUsaApi,
} from '../../services/api';

const FEE_PERCENT = 2.5;

export default function USAWithdrawalScreen({navigation}: any): React.JSX.Element {
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const {data: balanceData} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });
  const {data: limitsData} = useQuery({
    queryKey: ['limits'],
    queryFn: () => limitsApi.get().then(r => r.data),
  });
  const {data: bankAccountsData, refetch: refetchBanks} = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => bankAccountApi.list().then(r => r.data),
  });

  const balance = parseFloat(balanceData?.balanceUsdt ?? '0');
  const dailyRemaining = limitsData?.dailyRemaining ?? 5000;
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * (FEE_PERCENT / 100);
  const total = amountNum + fee;
  const bankAccounts = Array.isArray(bankAccountsData) ? bankAccountsData : [];

  const handleWithdraw = async () => {
    if (!bankAccountId) {
      Alert.alert('Error', 'Agrega una cuenta bancaria primero');
      navigation.navigate('AddBankAccount');
      return;
    }
    if (amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (total > balance) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }
    if (amountNum > dailyRemaining) {
      Alert.alert('Error', `Límite diario restante: ${dailyRemaining} USDT`);
      return;
    }
    setLoading(true);
    try {
      const res = await withdrawalUsaApi.create({
        bankAccountId,
        amountUsdt: amountNum,
        note: note || undefined,
      });
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance']});
      queryClient.invalidateQueries({queryKey: ['limits']});
      Alert.alert(
        'Retiro enviado',
        `ETA: ~${res.data.etaMinutes} min. Te notificaremos cuando se complete.`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al procesar el retiro';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceValue}>{balance.toFixed(2)} USDT</Text>
          <Text style={styles.limitText}>
            Límite diario restante: {dailyRemaining.toFixed(0)} USDT
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Cuenta destino</Text>
        {bankAccounts.length === 0 ? (
          <TouchableOpacity
            style={styles.addBankBtn}
            onPress={() => navigation.navigate('AddBankAccount')}>
            <Text style={styles.addBankText}>+ Añadir cuenta bancaria USA</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={bankAccounts}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.bankItem,
                  bankAccountId === item.id && styles.bankItemSelected,
                ]}
                onPress={() => setBankAccountId(item.id)}>
                <Text style={styles.bankName}>
                  {item.accountHolder} •••• {item.lastFour}
                </Text>
                <Text style={styles.bankMeta}>
                  {item.accountType} • {item.status}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
        <TouchableOpacity
          style={styles.addBankLink}
          onPress={() => navigation.navigate('AddBankAccount')}>
          <Text style={styles.addBankLinkText}>+ Otra cuenta</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Monto en USDT</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={styles.feeText}>
          Comisión ({FEE_PERCENT}%): {fee.toFixed(2)} USDT • Total:{' '}
          {total.toFixed(2)} USDT
        </Text>
        <Text style={styles.feeText}>ETA: ~30 min (RTP) / 1-3 días (ACH)</Text>

        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Referencia"
          value={note}
          onChangeText={setNote}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleWithdraw}
          disabled={loading || bankAccounts.length === 0}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar a mi cuenta USA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
  balanceCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  balanceLabel: {fontSize: 12, color: '#666'},
  balanceValue: {fontSize: 20, fontWeight: 'bold', color: '#0066CC'},
  limitText: {fontSize: 12, color: '#666', marginTop: 4},
  sectionLabel: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  addBankBtn: {
    borderWidth: 2,
    borderColor: '#0066CC',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderStyle: 'dashed',
  },
  addBankText: {fontSize: 16, color: '#0066CC', fontWeight: '600'},
  bankItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankItemSelected: {borderColor: '#0066CC', backgroundColor: '#f0f9ff'},
  bankName: {fontSize: 16, fontWeight: '600'},
  bankMeta: {fontSize: 12, color: '#666', marginTop: 4},
  addBankLink: {marginBottom: 20},
  addBankLinkText: {fontSize: 14, color: '#0066CC'},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    fontSize: 16,
  },
  feeText: {fontSize: 12, color: '#666', marginBottom: 4},
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
