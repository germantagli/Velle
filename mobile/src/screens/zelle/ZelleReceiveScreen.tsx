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
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {zelleApi} from '../../services/api';

const CORPORATE_ZELLE = 'deposits@velle.app'; // Placeholder

export default function ZelleReceiveScreen({navigation}: any): React.JSX.Element {
  const [amount, setAmount] = useState('');
  const [zelleEmail, setZelleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositData, setDepositData] = useState<{
    reference: string;
    amount: number;
    corporateZelleEmail: string;
    instructions: string;
  } | null>(null);

  const handleGenerate = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!zelleEmail.trim()) {
      Alert.alert('Error', 'Ingresa tu email de Zelle para la referencia');
      return;
    }
    setLoading(true);
    setDepositData(null);
    try {
      const {data} = await zelleApi.requestDeposit(amountNum, zelleEmail.trim());
      setDepositData({
        reference: data.reference,
        amount: data.amount,
        corporateZelleEmail: data.corporateZelleEmail ?? CORPORATE_ZELLE,
        instructions: data.instructions,
      });
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al generar instrucciones';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!depositData) return;
    Share.share({
      message: `Deposita ${depositData.amount} USD a ${depositData.corporateZelleEmail} y usa la referencia ${depositData.reference} para acreditar USDT en Velle.`,
      title: 'Instrucciones de depósito Zelle',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {!depositData ? (
        <>
          <Text style={styles.title}>Recibir desde Zelle</Text>
          <Text style={styles.subtitle}>
            Ingresa el monto y tu email Zelle para generar las instrucciones
          </Text>
          <Text style={styles.label}>Monto a recibir (USD)</Text>
          <TextInput
            style={styles.input}
            placeholder="100.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <Text style={styles.label}>Tu email de Zelle (para referencia)</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            value={zelleEmail}
            onChangeText={setZelleEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generar instrucciones</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({
                ref: depositData.reference,
                amount: depositData.amount,
                email: depositData.corporateZelleEmail,
              })}
              size={180}
            />
          </View>
          <Text style={styles.refText}>Referencia: {depositData.reference}</Text>
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Instrucciones</Text>
            <Text style={styles.instructionsText}>
              1. Envía {depositData.amount} USD desde tu app Zelle
            </Text>
            <Text style={styles.instructionsText}>
              2. Destinatario: {depositData.corporateZelleEmail}
            </Text>
            <Text style={styles.instructionsText}>
              3. En la nota/memo escribe: {depositData.reference}
            </Text>
            <Text style={styles.instructionsText}>
              4. Tu USDT se acreditará en minutos
            </Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Compartir instrucciones</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setDepositData(null)}>
            <Text style={styles.secondaryBtnText}>Nueva solicitud</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
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
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 16,
  },
  refText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  instructions: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {fontSize: 16, fontWeight: '600', marginBottom: 12},
  instructionsText: {fontSize: 14, color: '#333', marginBottom: 6},
  shareBtn: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  secondaryBtn: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {color: '#0066CC', fontSize: 14},
});
