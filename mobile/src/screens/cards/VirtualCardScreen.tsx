import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {cardApi, VirtualCard} from '../../services/api';

export default function VirtualCardScreen({navigation}: any): React.JSX.Element {
  const [showCard, setShowCard] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardApi.list().then(r => r.data),
  });
  const cards = data?.cards ?? [];

  const createMutation = useMutation({
    mutationFn: () => cardApi.create().then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['cards']}),
  });

  const handleCreate = () => {
    Alert.alert(
      'Crear tarjeta',
      'Se generará una tarjeta virtual Visa/Mastercard vinculada a tu saldo USDT.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Crear', onPress: () => createMutation.mutate()},
      ],
    );
  };

  const toggleShow = (id: string) => {
    setShowCard(prev => (prev === id ? null : id));
  };

  const maskNumber = (lastFour: string) =>
    `•••• •••• •••• ${lastFour}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Tarjetas virtuales Visa/Mastercard para compras online
      </Text>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No tienes tarjetas virtuales</Text>
          <Text style={styles.emptyDesc}>
            Crea una tarjeta para comprar en tiendas online
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreate}
            disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Crear tarjeta</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {cards.map((card: VirtualCard) => (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              onPress={() => toggleShow(card.id)}
              activeOpacity={0.9}>
              <Text style={styles.cardBrand}>{card.brand}</Text>
              <Text style={styles.cardNumber}>
                {showCard === card.id
                  ? maskNumber(card.lastFour)
                  : '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardExp}>
                  {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                </Text>
                <Text style={styles.cardBalance}>
                  {parseFloat(card.balance || '0').toFixed(2)} USDT
                </Text>
              </View>
              {card.frozen && (
                <View style={styles.frozenBadge}>
                  <Text style={styles.frozenText}>Congelada</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleCreate}
            disabled={createMutation.isPending}>
            <Text style={styles.addBtnText}>+ Crear otra tarjeta</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingBottom: 48},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 24},
  loading: {padding: 48, alignItems: 'center'},
  empty: {alignItems: 'center', paddingVertical: 48},
  emptyText: {fontSize: 18, fontWeight: '600', marginBottom: 8},
  emptyDesc: {fontSize: 14, color: '#666', marginBottom: 24},
  createBtn: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  createBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    minHeight: 180,
  },
  cardBrand: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  cardNumber: {
    fontSize: 20,
    color: '#fff',
    letterSpacing: 2,
    marginTop: 24,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cardExp: {fontSize: 14, color: 'rgba(255,255,255,0.8)'},
  cardBalance: {fontSize: 14, color: '#fff', fontWeight: '600'},
  frozenBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  frozenText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  addBtn: {
    borderWidth: 2,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  addBtnText: {color: '#0066CC', fontSize: 16, fontWeight: '600'},
});
