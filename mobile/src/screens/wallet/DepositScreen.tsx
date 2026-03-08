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
} from 'react-native';
import {depositApi} from '../../services/api';
import {useQueryClient} from '@tanstack/react-query';

export default function DepositScreen({navigation}: any): React.JSX.Element {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    reference: string;
    amount: number;
    instructions: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const handleCreate = async () => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido en bolívares');
      return;
    }
    setLoading(true);
    try {
      const res = await depositApi.create(amountNum);
      setResult({
        reference: res.data.reference,
        amount: res.data.amount,
        instructions: res.data.instructions,
      });
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance']});
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al crear depósito';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAmount('');
  };

  if (result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Referencia generada</Text>
          <Text style={styles.reference}>{result.reference}</Text>
          <Text style={styles.amountLabel}>Monto a pagar</Text>
          <Text style={styles.amountValue}>
            {result.amount.toLocaleString('es-VE')} VES
          </Text>
          <Text style={styles.instructions}>{result.instructions}</Text>
          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Nueva solicitud</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Monto en bolívares (VES)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 1000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={styles.hint}>
          Realiza tu pago móvil o transferencia con la referencia que se
          generará. El administrador confirmará tu depósito.
        </Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generar referencia</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 18,
  },
  hint: {fontSize: 13, color: '#666', marginBottom: 24},
  button: {
    backgroundColor: '#0d9488',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  successCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
  },
  reference: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0d9488',
    marginBottom: 8,
    letterSpacing: 2,
  },
  amountLabel: {fontSize: 14, color: '#666', marginTop: 16},
  amountValue: {fontSize: 22, fontWeight: '700', color: '#166534', marginBottom: 16},
  instructions: {fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 24},
});
