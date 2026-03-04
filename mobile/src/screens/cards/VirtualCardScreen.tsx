import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function VirtualCardScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarjeta virtual</Text>
      <Text style={styles.subtitle}>
        Genera una tarjeta Visa/Mastercard vinculada a tu saldo USDT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: 'bold'},
  subtitle: {fontSize: 14, color: '#666', marginTop: 8},
});
