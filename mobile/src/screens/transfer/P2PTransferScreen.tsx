import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function P2PTransferScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transferencia P2P</Text>
      <Text style={styles.subtitle}>
        Envía USDT a otro usuario de Velle por teléfono o email
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: 'bold'},
  subtitle: {fontSize: 14, color: '#666', marginTop: 8},
});
