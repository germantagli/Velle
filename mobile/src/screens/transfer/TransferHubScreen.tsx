import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

export default function TransferHubScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{t('transferHub.subtitle')}</Text>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('P2PTransfer')}>
        <Text style={styles.cardEmoji}>👤</Text>
        <Text style={styles.cardTitle}>{t('transferHub.transferToUser')}</Text>
        <Text style={styles.cardDesc}>{t('transferHub.transferToUserDesc')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.card, styles.disabled]}
        disabled>
        <Text style={styles.cardEmoji}>🏪</Text>
        <Text style={styles.cardTitle}>{t('transferHub.payMerchant')}</Text>
        <Text style={styles.cardDesc}>{t('transferHub.payMerchantDesc')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.card, styles.disabled]}
        disabled>
        <Text style={styles.cardEmoji}>💳</Text>
        <Text style={styles.cardTitle}>{t('transferHub.virtualCard')}</Text>
        <Text style={styles.cardDesc}>{t('transferHub.virtualCardDesc')}</Text>
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
  disabled: {opacity: 0.5},
});
