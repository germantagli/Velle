import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {userApi} from '../../services/api';
import {useAuthStore} from '../../store/authStore';

export default function NotificationsScreen({navigation}: any): React.JSX.Element {
  const setAuth = useAuthStore(s => s.setAuth);
  const queryClient = useQueryClient();

  const {data: profile, isLoading} = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userApi.getProfile().then(r => r.data),
  });

  const notificationsEnabled = profile?.notificationsEnabled ?? false;

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => userApi.setNotifications(enabled),
    onSuccess: (_, enabled) => {
      setAuth({
        user: {...useAuthStore.getState().user!, notificationsEnabled: enabled},
      });
      queryClient.invalidateQueries({queryKey: ['user', 'profile']});
    },
    onError: (e: any) => {
      Alert.alert(
        'Error',
        e.response?.data?.message || 'No se pudo actualizar',
      );
    },
  });

  const handleToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Activar notificaciones',
        'Recibirás avisos por email y push cuando envías o recibes dinero. ¿Continuar?',
        [
          {text: 'Cancelar', style: 'cancel'},
          {text: 'Activar', onPress: () => mutation.mutate(true)},
        ],
      );
    } else {
      mutation.mutate(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notificaciones de transacciones</Text>
        <Text style={styles.cardDesc}>
          Recibe avisos cuando envías o recibes dinero (email y push)
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Activar notificaciones</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggle}
            disabled={mutation.isPending}
            trackColor={{false: '#ddd', true: '#93c5fd'}}
            thumbColor={notificationsEnabled ? '#0066CC' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', padding: 24},
  centered: {justifyContent: 'center', alignItems: 'center'},
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {fontSize: 18, fontWeight: 'bold', color: '#1a1a2e'},
  cardDesc: {fontSize: 14, color: '#666', marginTop: 8, marginBottom: 20},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {fontSize: 16, color: '#333'},
});
