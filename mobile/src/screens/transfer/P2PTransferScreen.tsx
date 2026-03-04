import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {transferApi, walletApi} from '../../services/api';

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function P2PTransferScreen({navigation}: any): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const {data: balanceData} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });
  const balance = parseFloat(balanceData?.balance ?? '0');

  const {data: searchData} = useQuery({
    queryKey: ['transfer', 'search', query],
    queryFn: () => transferApi.searchUser(query).then(r => r.data),
    enabled: query.length >= 2,
  });
  const users = searchData?.users ?? [];

  const amountNum = parseFloat(amount) || 0;

  const handleSend = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Selecciona un destinatario');
      return;
    }
    if (amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (amountNum > balance) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }
    setLoading(true);
    try {
      await transferApi.p2p(selectedUser.id, amountNum, note || undefined);
      Alert.alert('Éxito', 'Transferencia enviada correctamente', () =>
        navigation.goBack(),
      );
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || 'Error al transferir';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.label}>Buscar destinatario (email o teléfono)</Text>
        <TextInput
          style={styles.input}
          placeholder="usuario@email.com"
          value={query}
          onChangeText={t => {
            setQuery(t);
            if (!t) setSelectedUser(null);
          }}
          autoCapitalize="none"
          editable={!loading}
        />
        {users.length > 0 && !selectedUser && (
          <FlatList
            data={users}
            keyExtractor={item => item.id}
            style={styles.userList}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => setSelectedUser(item)}>
                <Text style={styles.userName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </TouchableOpacity>
            )}
          />
        )}
        {selectedUser && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedLabel}>Destinatario</Text>
            <Text style={styles.selectedName}>
              {selectedUser.firstName} {selectedUser.lastName}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.label}>Monto (USDT)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={styles.balanceText}>Saldo: {balance.toFixed(2)} USDT</Text>
        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Concepto del pago"
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
            <Text style={styles.buttonText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  userList: {maxHeight: 160, marginBottom: 16},
  userItem: {
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
  },
  userName: {fontSize: 16, fontWeight: '600'},
  userEmail: {fontSize: 12, color: '#666'},
  selectedCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedLabel: {fontSize: 12, color: '#666'},
  selectedName: {fontSize: 16, fontWeight: '600'},
  changeBtn: {marginTop: 8},
  changeBtnText: {color: '#0066CC', fontSize: 14},
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
