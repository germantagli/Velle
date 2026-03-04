import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function TransactionDetailScreen({route}: any): React.JSX.Element {
  const {id} = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transacción #{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: 'bold'},
});
