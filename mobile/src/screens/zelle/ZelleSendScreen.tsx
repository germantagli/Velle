import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {zelleApi, walletApi} from '../../services/api';

const FEE_PERCENT = 2;

export default function ZelleSendScreen({navigation}: any): React.JSX.Element {
  const [amount, setAmount] = useState('');
  const [zelleEmail, setZelleEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const {data: balanceData} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });
  const balance = parseFloat(balanceData?.balance ?? '0');
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * (FEE_PERCENT / 100);
  const total = amountNum + fee;

  const handleSend = async () => {
    if (amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!zelleEmail.trim()) {
      Alert.alert('Error', 'Ingresa el email de la cuenta Zelle destino');
      return;
    }
    if (total > balance) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }
    setLoading(true);
    try {
      await zelleApi.sendToZelle(amountNum, zelleEmail.trim(), note || undefined);
      Alert.alert('Éxito', 'Transferencia enviada. El dinero llegará en minutos.', () =>
        navigation.goBack(),
      );
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al enviar';
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
          <Text style={styles.balanceValue}>
            {balance.toFixed(2)} USDT
          </Text>
        </View>
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
          Comisión ({FEE_PERCENT}%): {fee.toFixed(2)} USDT • Total: {total.toFixed(2)} USDT
        </Text>
        <Text style={styles.label}>Email de la cuenta Zelle destino</Text>
        <TextInput
          style={styles.input}
          placeholder="usuario@email.com"
          value={zelleEmail}
          onChangeText={setZelleEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Referencia del envío"
          value={note}
          onChangeText={setNote}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar a Zelle</Text>
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
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {minHeight: 60},
  feeText: {fontSize: 12, color: '#666', marginBottom: 16},
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
