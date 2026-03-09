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
import {useAuthStore} from '../../store/authStore';

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export default function P2PTransferScreen({navigation}: any): React.JSX.Element {
  const currentUser = useAuthStore(s => s.user);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState<'VES' | 'USDT'>('VES');
  const [loading, setLoading] = useState(false);

  const {data: balanceData} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });
  const balanceVes = parseFloat(balanceData?.balanceVes ?? '0');
  const balanceUsdt = parseFloat(balanceData?.balanceUsdt ?? '0');
  const balance = currency === 'VES' ? balanceVes : balanceUsdt;

  const {data: searchData, isLoading: searching} = useQuery({
    queryKey: ['transfer', 'search', query.trim()],
    queryFn: () => transferApi.searchUser(query.trim()).then(r => r.data),
    enabled: query.trim().length >= 3,
    staleTime: 5000,
  });
  const users = (searchData?.users ?? []).filter(
    u => u.id !== currentUser?.id,
  );

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
      await transferApi.p2p(
        selectedUser.id,
        amountNum,
        note || undefined,
        currency,
      );
      Alert.alert('Éxito', 'Transferencia enviada correctamente', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
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
        <Text style={styles.label}>Buscar destinatario</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre, email o teléfono (mín. 3 caracteres)"
          value={query}
          onChangeText={t => {
            setQuery(t);
            if (!t.trim()) setSelectedUser(null);
          }}
          autoCapitalize="none"
          editable={!loading}
        />
        {query.trim().length > 0 && query.trim().length < 3 && !selectedUser && (
          <Text style={styles.hint}>Escribe al menos 3 caracteres para buscar</Text>
        )}
        {searching && query.trim().length >= 3 && !selectedUser && (
          <View style={styles.searchingRow}>
            <ActivityIndicator size="small" color="#0066CC" />
            <Text style={styles.searchingText}>Buscando...</Text>
          </View>
        )}
        {users.length > 0 && !selectedUser && !searching && (
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
                <Text style={styles.userPhone}>
                  Tel: {item.phone ?? '—'}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
        {query.trim().length >= 3 && users.length === 0 && !searching && !selectedUser && (
          <Text style={styles.emptyText}>No se encontraron usuarios</Text>
        )}
        {selectedUser && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedLabel}>Destinatario</Text>
            <Text style={styles.selectedName}>
              {selectedUser.firstName} {selectedUser.lastName}
            </Text>
            <Text style={styles.selectedEmail}>{selectedUser.email}</Text>
            <Text style={styles.selectedPhone}>
              Tel: {selectedUser.phone ?? '—'}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.currencyRow}>
          <TouchableOpacity
            style={[
              styles.currencyBtn,
              currency === 'VES' && styles.currencyBtnActive,
            ]}
            onPress={() => setCurrency('VES')}>
            <Text
              style={[
                styles.currencyText,
                currency === 'VES' && styles.currencyTextActive,
              ]}>
              VES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.currencyBtn,
              currency === 'USDT' && styles.currencyBtnActive,
            ]}
            onPress={() => setCurrency('USDT')}>
            <Text
              style={[
                styles.currencyText,
                currency === 'USDT' && styles.currencyTextActive,
              ]}>
              USDT
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Monto ({currency})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={styles.balanceText}>
          Saldo: {currency === 'VES' ? balance.toLocaleString('es-VE') : balance.toFixed(2)} {currency}
        </Text>
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
  hint: {fontSize: 12, color: '#888', marginBottom: 8},
  searchingRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  searchingText: {fontSize: 14, color: '#666'},
  emptyText: {fontSize: 14, color: '#888', marginBottom: 16},
  userList: {maxHeight: 200, marginBottom: 16},
  userItem: {
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
  },
  userName: {fontSize: 16, fontWeight: '600'},
  userEmail: {fontSize: 12, color: '#666'},
  userPhone: {fontSize: 12, color: '#666', marginTop: 2},
  selectedCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedLabel: {fontSize: 12, color: '#666'},
  selectedName: {fontSize: 16, fontWeight: '600'},
  selectedEmail: {fontSize: 13, color: '#555', marginTop: 4},
  selectedPhone: {fontSize: 13, color: '#555', marginTop: 2},
  changeBtn: {marginTop: 8},
  changeBtnText: {color: '#0066CC', fontSize: 14},
  balanceText: {fontSize: 12, color: '#666', marginBottom: 16},
  currencyRow: {flexDirection: 'row', gap: 12, marginBottom: 16},
  currencyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currencyBtnActive: {backgroundColor: '#0066CC', borderColor: '#0066CC'},
  currencyText: {fontSize: 14, fontWeight: '600', color: '#666'},
  currencyTextActive: {color: '#fff'},
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
