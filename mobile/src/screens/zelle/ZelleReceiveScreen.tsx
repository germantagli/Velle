import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ZelleReceiveScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recibir desde Zelle</Text>
      <Text style={styles.subtitle}>
        Obtén instrucciones para enviar desde tu cuenta Zelle en EE.UU. y acreditar USDT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: 'bold'},
  subtitle: {fontSize: 14, color: '#666', marginTop: 8},
});
