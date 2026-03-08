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
import {useQuery} from '@tanstack/react-query';
import {conversionApi, walletApi} from '../../services/api';
import {useQueryClient} from '@tanstack/react-query';

type Direction = 'ves-to-usdt' | 'usdt-to-ves';

export default function ConvertScreen({navigation}: any): React.JSX.Element {
  const [direction, setDirection] = useState<Direction>('ves-to-usdt');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const {data: balanceData} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });
  const {data: rateData} = useQuery({
    queryKey: ['conversion', 'rate'],
    queryFn: () => conversionApi.getRate().then(r => r.data),
  });

  const balanceVes = parseFloat(balanceData?.balanceVes ?? '0');
  const balanceUsdt = parseFloat(balanceData?.balanceUsdt ?? '0');
  const rate = rateData?.rate ?? 36;
  const amountNum = parseFloat(amount) || 0;

  const feePercent = 1;
  let resultText = '';
  if (direction === 'ves-to-usdt' && amountNum > 0) {
    const usdtGross = amountNum / rate;
    const fee = usdtGross * (feePercent / 100);
    const usdtNet = usdtGross - fee;
    resultText = `Recibirás ≈ ${usdtNet.toFixed(2)} USDT (comisión 1%: ${fee.toFixed(2)} USDT)`;
  } else if (direction === 'usdt-to-ves' && amountNum > 0) {
    const vesGross = amountNum * rate;
    const fee = vesGross * (feePercent / 100);
    const vesNet = vesGross - fee;
    resultText = `Recibirás ≈ ${vesNet.toLocaleString('es-VE', {maximumFractionDigits: 0})} VES (comisión 1%: ${fee.toLocaleString('es-VE', {maximumFractionDigits: 0})} VES)`;
  }

  const handleConvert = async () => {
    if (amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (direction === 'ves-to-usdt' && amountNum > balanceVes) {
      Alert.alert('Error', 'Saldo en VES insuficiente');
      return;
    }
    if (direction === 'usdt-to-ves' && amountNum > balanceUsdt) {
      Alert.alert('Error', 'Saldo en USDT insuficiente');
      return;
    }
    setLoading(true);
    try {
      if (direction === 'ves-to-usdt') {
        await conversionApi.vesToUsdt(amountNum);
        Alert.alert('Éxito', 'Conversión completada. VES → USDT', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await conversionApi.usdtToVes(amountNum);
        Alert.alert('Éxito', 'Conversión completada. USDT → VES', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance']});
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error en la conversión';
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
        <Text style={styles.rateLabel}>Tasa actual: 1 USDT = {rate} VES</Text>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              direction === 'ves-to-usdt' && styles.toggleBtnActive,
            ]}
            onPress={() => setDirection('ves-to-usdt')}>
            <Text
              style={[
                styles.toggleText,
                direction === 'ves-to-usdt' && styles.toggleTextActive,
              ]}>
              VES → USDT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              direction === 'usdt-to-ves' && styles.toggleBtnActive,
            ]}
            onPress={() => setDirection('usdt-to-ves')}>
            <Text
              style={[
                styles.toggleText,
                direction === 'usdt-to-ves' && styles.toggleTextActive,
              ]}>
              USDT → VES
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          {direction === 'ves-to-usdt' ? 'Monto en VES' : 'Monto en USDT'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={styles.balance}>
          Saldo:{' '}
          {direction === 'ves-to-usdt'
            ? `${balanceVes.toLocaleString('es-VE')} VES`
            : `${balanceUsdt.toFixed(2)} USDT`}
        </Text>
        {resultText ? (
          <Text style={styles.resultText}>{resultText}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConvert}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Convertir</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
  rateLabel: {fontSize: 14, color: '#666', marginBottom: 20},
  toggle: {flexDirection: 'row', marginBottom: 24},
  toggleBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  toggleBtnActive: {backgroundColor: '#0066CC', borderColor: '#0066CC'},
  toggleText: {fontSize: 15, fontWeight: '600', color: '#666'},
  toggleTextActive: {color: '#fff'},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    fontSize: 18,
  },
  balance: {fontSize: 12, color: '#666', marginBottom: 16},
  resultText: {fontSize: 14, color: '#0d9488', fontWeight: '600', marginBottom: 24},
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
