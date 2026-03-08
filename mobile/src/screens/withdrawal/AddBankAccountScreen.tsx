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
import {useQueryClient} from '@tanstack/react-query';
import {bankAccountApi} from '../../services/api';

export default function AddBankAccountScreen({navigation}: any): React.JSX.Element {
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const handleAdd = async () => {
    if (!accountHolder.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del titular');
      return;
    }
    if (!accountNumber.trim() || accountNumber.replace(/\D/g, '').length < 4) {
      Alert.alert('Error', 'Número de cuenta inválido');
      return;
    }
    if (!routingNumber.trim() || routingNumber.replace(/\D/g, '').length !== 9) {
      Alert.alert('Error', 'Routing number debe tener 9 dígitos');
      return;
    }
    setLoading(true);
    try {
      await bankAccountApi.create({
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.replace(/\D/g, ''),
        routingNumber: routingNumber.replace(/\D/g, ''),
        accountType,
        bankName: bankName.trim() || undefined,
      });
      queryClient.invalidateQueries({queryKey: ['bank-accounts']});
      Alert.alert('Cuenta añadida', 'Tu cuenta ha sido verificada.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al añadir la cuenta';
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
        <Text style={styles.label}>Nombre del titular</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={accountHolder}
          onChangeText={setAccountHolder}
          autoCapitalize="words"
          editable={!loading}
        />
        <Text style={styles.label}>Routing number (9 dígitos)</Text>
        <TextInput
          style={styles.input}
          placeholder="021000021"
          value={routingNumber}
          onChangeText={setRoutingNumber}
          keyboardType="number-pad"
          maxLength={9}
          editable={!loading}
        />
        <Text style={styles.label}>Número de cuenta</Text>
        <TextInput
          style={styles.input}
          placeholder="1234567890"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          editable={!loading}
        />
        <Text style={styles.label}>Tipo de cuenta</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              accountType === 'checking' && styles.typeBtnActive,
            ]}
            onPress={() => setAccountType('checking')}>
            <Text
              style={[
                styles.typeText,
                accountType === 'checking' && styles.typeTextActive,
              ]}>
              Checking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              accountType === 'savings' && styles.typeBtnActive,
            ]}
            onPress={() => setAccountType('savings')}>
            <Text
              style={[
                styles.typeText,
                accountType === 'savings' && styles.typeTextActive,
              ]}>
              Savings
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Banco (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Chase, Bank of America, etc."
          value={bankName}
          onChangeText={setBankName}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Añadir cuenta</Text>
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
    fontSize: 16,
  },
  typeRow: {flexDirection: 'row', gap: 12, marginBottom: 16},
  typeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeBtnActive: {backgroundColor: '#0066CC', borderColor: '#0066CC'},
  typeText: {fontSize: 15, fontWeight: '600', color: '#666'},
  typeTextActive: {color: '#fff'},
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
