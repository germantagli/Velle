import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export default function ZelleHubScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Envía o recibe dinero desde EE.UU. vía Zelle
      </Text>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ZelleReceive')}>
        <Text style={styles.cardEmoji}>📥</Text>
        <Text style={styles.cardTitle}>Recibir dinero</Text>
        <Text style={styles.cardDesc}>
          Obtén instrucciones para depositar desde tu cuenta Zelle
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ZelleSend')}>
        <Text style={styles.cardEmoji}>📤</Text>
        <Text style={styles.cardTitle}>Enviar dinero</Text>
        <Text style={styles.cardDesc}>
          Convierte USDT y envía a una cuenta Zelle en EE.UU.
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
