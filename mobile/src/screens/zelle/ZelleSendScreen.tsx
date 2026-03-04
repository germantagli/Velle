import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ZelleSendScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enviar a Zelle</Text>
      <Text style={styles.subtitle}>
        Convierte USDT de tu wallet y envía a una cuenta Zelle en EE.UU.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: 'bold'},
  subtitle: {fontSize: 14, color: '#666', marginTop: 8},
});
