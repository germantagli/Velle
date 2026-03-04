import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export default function TransferHubScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Transferencias y pagos en USDT
      </Text>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('P2PTransfer')}>
        <Text style={styles.cardEmoji}>👤</Text>
        <Text style={styles.cardTitle}>Transferir a usuario</Text>
        <Text style={styles.cardDesc}>
          Envía USDT a otro usuario de Velle por teléfono o email
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MerchantPay')}>
        <Text style={styles.cardEmoji}>🏪</Text>
        <Text style={styles.cardTitle}>Pagar en comercio</Text>
        <Text style={styles.cardDesc}>
          Escanea QR o usa NFC para pagar en tiendas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('VirtualCard')}>
        <Text style={styles.cardEmoji}>💳</Text>
        <Text style={styles.cardTitle}>Tarjeta virtual</Text>
        <Text style={styles.cardDesc}>
          Visa/Mastercard para compras online
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, backgroundColor: '#f5f5f5'},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 20},
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardEmoji: {fontSize: 32, marginBottom: 12},
  cardTitle: {fontSize: 18, fontWeight: 'bold', color: '#1a1a2e'},
  cardDesc: {fontSize: 14, color: '#666', marginTop: 8},
});
