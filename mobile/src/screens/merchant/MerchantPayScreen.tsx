import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {merchantApi, transferApi, walletApi} from '../../services/api';

export default function MerchantPayScreen({
  navigation,
  route,
}: any): React.JSX.Element {
  const merchantId = route.params?.merchantId;
  const [qrCode, setQrCode] = useState(merchantId ?? '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [merchant, setMerchant] = useState<{
    id: string;
    name: string;
    documentId: string;
  } | null>(null);

  const {data: balanceData} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });
  const balance = parseFloat(balanceData?.balance ?? '0');

  const lookupMerchant = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Error', 'Escanea el código QR del comercio o ingresa el ID');
      return;
    }
    setLoading(true);
    try {
      const {data} = await merchantApi.getByQr(qrCode.trim());
      setMerchant(data);
    } catch (e: any) {
      setMerchant(null);
      Alert.alert('Error', 'Comercio no encontrado. Verifica el código.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!merchant) {
      Alert.alert('Error', 'Busca un comercio primero');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Ingresa el monto a pagar');
      return;
    }
    if (amountNum > balance) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }
    setLoading(true);
    try {
      await transferApi.merchant(merchant.id, amountNum, 'qr');
      Alert.alert('Éxito', `Pago de ${amountNum} USDT a ${merchant.name} realizado`, () =>
        navigation.goBack(),
      );
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al pagar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagar en comercio</Text>
      <Text style={styles.subtitle}>
        Escanea el QR del comercio o ingresa el código
      </Text>
      <Text style={styles.label}>Código QR o ID del comercio</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: MERCHANT-ABC123"
        value={qrCode}
        onChangeText={setQrCode}
        editable={!merchant}
      />
      {!merchant ? (
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={lookupMerchant}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Buscar comercio</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.merchantCard}>
            <Text style={styles.merchantLabel}>Comercio</Text>
            <Text style={styles.merchantName}>{merchant.name}</Text>
            <TouchableOpacity onPress={() => setMerchant(null)}>
              <Text style={styles.changeText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Monto a pagar (USDT)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <Text style={styles.balanceText}>
            Saldo disponible: {balance.toFixed(2)} USDT
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePay}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Pagar</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#fff'},
  title: {fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e'},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 24},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  merchantCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  merchantLabel: {fontSize: 12, color: '#666'},
  merchantName: {fontSize: 18, fontWeight: 'bold'},
  changeText: {color: '#0066CC', marginTop: 8, fontSize: 14},
  balanceText: {fontSize: 12, color: '#666', marginBottom: 16},
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
