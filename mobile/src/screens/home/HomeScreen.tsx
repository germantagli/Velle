import React from 'react';
import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
  const {data, isLoading, refetch} = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance().then(r => r.data),
  });

  const balanceVes = data?.balanceVes ?? data?.balance ?? '0';
  const balanceUsdt = data?.balanceUsdt ?? data?.balance ?? '0';

  const formatAmount = (val: string, decimals = 2) =>
    parseFloat(val).toLocaleString('es-VE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: 6,
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }>
      <View style={styles.mainBalance}>
        <Text style={styles.label}>{t('home.balance')}</Text>
        <Text style={styles.mainAmount}>{formatAmount(balanceUsdt)} USDT</Text>
        <Text style={styles.secondary}>≈ {formatAmount(balanceVes)} VES</Text>
      </View>
      <View style={styles.balancesRow}>
        <View style={[styles.card, styles.cardVes]}>
          <Text style={styles.cardLabel}>VES</Text>
          <Text style={styles.cardAmount}>{formatAmount(balanceVes)}</Text>
        </View>
        <View style={[styles.card, styles.cardUsdt]}>
          <Text style={styles.cardLabel}>USDT</Text>
          <Text style={styles.cardAmount}>{formatAmount(balanceUsdt)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Deposit')}>
          <Text style={styles.actionEmoji}>💵</Text>
          <Text style={styles.actionLabel}>{t('home.addVes')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Convert')}>
          <Text style={styles.actionEmoji}>🔄</Text>
          <Text style={styles.actionLabel}>{t('home.convert')}</Text>
        </TouchableOpacity>
        {/* Zelle comentado por ahora
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
        */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('P2PTransfer')}>
          <Text style={styles.actionEmoji}>👤</Text>
          <Text style={styles.actionLabel}>{t('home.transfer')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.disabled]}
          disabled>
          <Text style={styles.actionEmoji}>🏪</Text>
          <Text style={styles.actionLabel}>{t('home.payMerchant')}</Text>
          <Text style={styles.actionSubtitleSoon}>
            {t('common.comingSoon')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('USAWithdrawal')}>
          <Text style={styles.actionEmoji}>🇺🇸</Text>
          <Text style={styles.actionLabel}>{t('home.usaWithdraw')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.cardBtn, styles.disabled]}
        disabled>
        <Text style={styles.cardBtnText}>
          💳 {t('home.viewVirtualCard')}
        </Text>
        <Text style={styles.cardBtnSubtitleSoon}>
          {t('common.comingSoon')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.historyLink}
        onPress={() => navigation.getParent()?.navigate('Historial')}>
        <Text style={styles.historyLinkText}>{t('home.viewTransactionHistory')} →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 32},
  mainBalance: {
    backgroundColor: '#0066CC',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  mainAmount: {fontSize: 28, fontWeight: 'bold', color: '#fff'},
  secondary: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4},
  balancesRow: {flexDirection: 'row', gap: 12, marginBottom: 20},
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  cardVes: {backgroundColor: '#0d9488'},
  cardUsdt: {backgroundColor: '#047857'},
  cardLabel: {fontSize: 12, color: 'rgba(255,255,255,0.8)'},
  cardAmount: {fontSize: 18, fontWeight: 'bold', color: '#fff'},
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
  actionSubtitleSoon: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabled: {opacity: 0.5},
  cardBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'flex-start',
  },
  cardBtnText: {fontSize: 16, fontWeight: '600', color: '#333'},
  cardBtnSubtitleSoon: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    fontWeight: '500',
  },
  historyLink: {alignItems: 'center'},
  historyLinkText: {fontSize: 14, color: '#0066CC'},
});
