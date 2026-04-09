import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
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
  Share,
} from 'react-native';
import {DepositOrder, depositApi} from '../../services/api';
import {useQueryClient} from '@tanstack/react-query';

type UiStep =
  | 'create'
  | 'instructions'
  | 'confirm_form'
  | 'verifying'
  | 'success'
  | 'not_found'
  | 'manual_review'
  | 'rejected'
  | 'expired';

const MAX_POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 3500;

export default function DepositScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [order, setOrder] = useState<DepositOrder | null>(null);
  const [forceConfirmForm, setForceConfirmForm] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [payerPhone, setPayerPhone] = useState('');
  const [payerBank, setPayerBank] = useState('Banesco');
  const [payerReference, setPayerReference] = useState('');
  const [payerReceiptUrl, setPayerReceiptUrl] = useState('');

  const queryClient = useQueryClient();

  const currentStep = useMemo<UiStep>(() => {
    if (!order) return 'create';
    if (forceConfirmForm) return 'confirm_form';
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return 'instructions';
      case 'PAYMENT_SUBMITTED':
      case 'VERIFICATION_PENDING':
        if (pollAttempts >= MAX_POLL_ATTEMPTS) return 'not_found';
        return 'verifying';
      case 'CONFIRMED':
        return 'success';
      case 'MANUAL_REVIEW':
        return 'manual_review';
      case 'REJECTED':
        return 'rejected';
      case 'EXPIRED':
        return 'expired';
      default:
        return 'instructions';
    }
  }, [order, forceConfirmForm, pollAttempts]);

  const handleCreate = async () => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) {
      Alert.alert(t('common.error'), t('wallet.enterValidAmount'));
      return;
    }
    setLoading(true);
    try {
      const res = await depositApi.create(amountNum);
      setOrder(res.data);
      setPollAttempts(0);
      setForceConfirmForm(false);
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || t('wallet.createError');
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setAmount('');
    setPollAttempts(0);
    setForceConfirmForm(false);
    setPayerPhone('');
    setPayerBank('Banesco');
    setPayerReference('');
    setPayerReceiptUrl('');
  };

  const refreshOrder = async () => {
    if (!order) return;
    const latest = await depositApi.getOne(order.id);
    setOrder(latest.data);
  };

  const handleSubmitPayment = async () => {
    if (!order) return;
    if (!/^\d{10,15}$/.test(payerPhone.trim())) {
      Alert.alert('Error', 'Ingresa un teléfono válido (10-15 dígitos)');
      return;
    }
    if (!payerBank.trim()) {
      Alert.alert('Error', 'Debes indicar el banco origen');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await depositApi.submitPayment(order.id, {
        payerPhone: payerPhone.trim(),
        payerBank: payerBank.trim(),
        payerReference: payerReference.trim() || undefined,
        payerReceiptUrl: payerReceiptUrl.trim() || undefined,
      });
      setOrder(res.data);
      setForceConfirmForm(false);
      setPollAttempts(0);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'No se pudo confirmar';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRetryVerification = async () => {
    if (!order) return;
    setVerifying(true);
    try {
      const res = await depositApi.verify(order.id);
      setOrder(res.data);
      setPollAttempts(0);
    } catch {
      Alert.alert('Error', 'No se pudo reintentar la verificación');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendManualReview = async () => {
    if (!order) return;
    setVerifying(true);
    try {
      const res = await depositApi.sendToManualReview(order.id, 'Solicitado desde app');
      setOrder(res.data);
    } catch {
      Alert.alert('Error', 'No se pudo enviar a revisión manual');
    } finally {
      setVerifying(false);
    }
  };

  const shareValue = async (label: string, value: string) => {
    await Share.share({message: `${label}: ${value}`});
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await depositApi.getActive();
        if (mounted && res.data.item) {
          setOrder(res.data.item);
          setPollAttempts(0);
        }
      } catch {
        // si falla la recuperación, dejamos flujo normal de creación
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!order) return;
    if (currentStep !== 'verifying') return;
    let cancelled = false;
    setVerifying(true);

    const timer = setInterval(async () => {
      try {
        const res = await depositApi.verify(order.id);
        if (!cancelled) {
          setOrder(res.data);
          setPollAttempts(prev => prev + 1);
        }
      } catch {
        if (!cancelled) {
          setPollAttempts(prev => prev + 1);
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
      setVerifying(false);
    };
  }, [currentStep, order]);

  useEffect(() => {
    if (order?.status === 'CONFIRMED') {
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance']});
      queryClient.invalidateQueries({queryKey: ['wallet', 'transactions']});
    }
  }, [order?.status, queryClient]);

  if (!order) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Cargar bolívares</Text>
          <Text style={styles.label}>Monto deseado en VES</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 1000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <Text style={styles.hint}>Mínimo 1 VES. Se generará un monto exacto para conciliación.</Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cargar bolívares</Text>

      {(currentStep === 'instructions' || currentStep === 'confirm_form') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos para pagar</Text>
          <Text style={styles.itemLabel}>Banco destino</Text>
          <Text style={styles.itemValue}>{order.instructions.bankName}</Text>
          <TouchableOpacity onPress={() => shareValue('Banco destino', order.instructions.bankName)}>
            <Text style={styles.copyText}>Copiar banco</Text>
          </TouchableOpacity>

          <Text style={styles.itemLabel}>Teléfono receptor</Text>
          <Text style={styles.itemValue}>{order.instructions.receiverPhone}</Text>
          <TouchableOpacity onPress={() => shareValue('Teléfono receptor', order.instructions.receiverPhone)}>
            <Text style={styles.copyText}>Copiar teléfono</Text>
          </TouchableOpacity>

          <Text style={styles.itemLabel}>RIF / Cédula receptor</Text>
          <Text style={styles.itemValue}>{order.instructions.receiverDocument}</Text>
          <TouchableOpacity onPress={() => shareValue('Documento receptor', order.instructions.receiverDocument)}>
            <Text style={styles.copyText}>Copiar documento</Text>
          </TouchableOpacity>

          <Text style={styles.itemLabel}>Monto exacto a transferir</Text>
          <Text style={styles.amountValue}>
            {Number(order.exactAmountToPay).toLocaleString('es-VE', {minimumFractionDigits: 2})} VES
          </Text>
          <Text style={styles.subAmount}>
            Solicitado: {Number(order.amountRequested).toLocaleString('es-VE', {minimumFractionDigits: 2})} VES
          </Text>
          <TouchableOpacity onPress={() => shareValue('Monto exacto', order.exactAmountToPay)}>
            <Text style={styles.copyText}>Copiar monto</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Referencia de orden: {order.reference} · Expira: {new Date(order.expiresAt).toLocaleTimeString('es-VE')}
          </Text>
          {!forceConfirmForm && (
            <TouchableOpacity style={styles.button} onPress={() => setForceConfirmForm(true)}>
              <Text style={styles.buttonText}>Ya pagué</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {currentStep === 'confirm_form' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirmar pago</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono desde el que pagaste"
            value={payerPhone}
            onChangeText={setPayerPhone}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Banco origen"
            value={payerBank}
            onChangeText={setPayerBank}
          />
          <TextInput
            style={styles.input}
            placeholder="Referencia (opcional)"
            value={payerReference}
            onChangeText={setPayerReference}
          />
          <TextInput
            style={styles.input}
            placeholder="Comprobante URL (opcional / mock)"
            value={payerReceiptUrl}
            onChangeText={setPayerReceiptUrl}
          />
          <TouchableOpacity
            style={[styles.button, submittingPayment && styles.buttonDisabled]}
            onPress={handleSubmitPayment}
            disabled={submittingPayment}>
            {submittingPayment ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar pago</Text>}
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 'verifying' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verificando tu pago...</Text>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.hint}>
            Estamos consultando Banesco (mock). Intento {Math.min(pollAttempts + 1, MAX_POLL_ATTEMPTS)} de {MAX_POLL_ATTEMPTS}.
          </Text>
        </View>
      )}

      {currentStep === 'success' && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Pago confirmado</Text>
          <Text style={styles.amountValue}>
            +{Number(order.exactAmountToPay).toLocaleString('es-VE', {minimumFractionDigits: 2})} VES
          </Text>
          <Text style={styles.hint}>
            Referencia: {order.bankReconciliationRef || order.reference}
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 'not_found' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aún no encontramos tu pago</Text>
          <Text style={styles.hint}>Puede tardar unos minutos en reflejarse.</Text>
          <TouchableOpacity style={styles.button} onPress={handleRetryVerification} disabled={verifying}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSendManualReview} disabled={verifying}>
            <Text style={styles.secondaryButtonText}>Enviar a revisión manual</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 'manual_review' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>En revisión manual</Text>
          <Text style={styles.hint}>{order.manualReviewReason || 'Tu pago está siendo revisado por un analista.'}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={refreshOrder}>
            <Text style={styles.secondaryButtonText}>Actualizar estado</Text>
          </TouchableOpacity>
        </View>
      )}

      {(currentStep === 'rejected' || currentStep === 'expired') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {currentStep === 'expired' ? 'Orden expirada' : 'Depósito rechazado'}
          </Text>
          <Text style={styles.hint}>Puedes crear una nueva orden y volver a intentarlo.</Text>
          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Crear nueva orden</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
  title: {fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 16},
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0d9488',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {color: '#0d9488', fontSize: 15, fontWeight: '600'},
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12},
  itemLabel: {fontSize: 12, color: '#666', marginTop: 8},
  itemValue: {fontSize: 16, color: '#111827', fontWeight: '600'},
  subAmount: {fontSize: 13, color: '#475569', marginBottom: 8},
  copyText: {fontSize: 13, color: '#0066CC', marginTop: 4, marginBottom: 6},
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
