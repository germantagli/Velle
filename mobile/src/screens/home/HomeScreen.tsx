import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {walletApi} from '../../services/api';

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const {data, isLoading, refetch} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });

  const balance = data?.balance ?? '0.00';
  const currency = data?.currency ?? 'USDT';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }>
      <View style={styles.card}>
        <Text style={styles.label}>Tu saldo</Text>
        <Text style={styles.balance}>
          {parseFloat(balance).toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}{' '}
          {currency}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ZelleReceive')}>
          <Text style={styles.actionEmoji}>📥</Text>
          <Text style={styles.actionLabel}>Recibir Zelle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ZelleSend')}>
          <Text style={styles.actionEmoji}>📤</Text>
          <Text style={styles.actionLabel}>Enviar Zelle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('P2PTransfer')}>
          <Text style={styles.actionEmoji}>👤</Text>
          <Text style={styles.actionLabel}>Transferir P2P</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('MerchantPay')}>
          <Text style={styles.actionEmoji}>🏪</Text>
          <Text style={styles.actionLabel}>Pagar comercio</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.cardBtn}
        onPress={() => navigation.navigate('VirtualCard')}>
        <Text style={styles.cardBtnText}>💳 Ver tarjeta virtual</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.historyLink}
        onPress={() => navigation.getParent()?.navigate('Historial')}>
        <Text style={styles.historyLinkText}>Ver historial de transacciones →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 32},
  card: {
    backgroundColor: '#0066CC',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  label: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4},
  balance: {fontSize: 28, fontWeight: 'bold', color: '#fff'},
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionEmoji: {fontSize: 24, marginBottom: 8},
  actionLabel: {fontSize: 13, fontWeight: '600', color: '#333'},
  cardBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardBtnText: {fontSize: 16, fontWeight: '600', color: '#333'},
  historyLink: {alignItems: 'center'},
  historyLinkText: {fontSize: 14, color: '#0066CC'},
});
