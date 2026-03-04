import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function MerchantPayScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagar en comercio</Text>
      <Text style={styles.subtitle}>
        Escanea el QR del comercio o usa NFC para pagar en USDT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: 'bold'},
  subtitle: {fontSize: 14, color: '#666', marginTop: 8},
});
