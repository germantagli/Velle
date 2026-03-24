import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useQuery} from '@tanstack/react-query';
import HomeScreen from '../screens/home/HomeScreen';
import TransferHubScreen from '../screens/transfer/TransferHubScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import NotificationInboxScreen from '../screens/notifications/NotificationInboxScreen';
import ProfileStack from './ProfileStack';
import {notificationApi} from '../services/api';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Inicio: '💳',
  Transferir: '📤',
  Historial: '📋',
  Notificaciones: '🔔',
  Perfil: '👤',
};

function TabIcon({name, focused}: {name: string; focused: boolean}) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.icon, !focused && styles.iconInactive]}>
        {TAB_ICONS[name] ?? '•'}
      </Text>
    </View>
  );
}

export default function MainTabs(): React.JSX.Element {
  const {t} = useTranslation();
  const {data} = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(1).then(r => r.data),
    staleTime: 30000,
    refetchOnMount: 'always', // actualizar badge al abrir la app
  });
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: true,
        headerStyle: {backgroundColor: '#fff'},
        headerTitleStyle: {fontWeight: '600', color: '#1a1a2e'},
        headerShadowVisible: false,
      })}>
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{title: t('tabs.wallet')}}
      />
      <Tab.Screen
        name="Transferir"
        component={TransferHubScreen}
        options={{title: t('tabs.transfers')}}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{title: t('tabs.history')}}
      />
      <Tab.Screen
        name="Notificaciones"
        component={NotificationInboxScreen}
        options={{
          title: t('tabs.notifications', {defaultValue: 'Notificaciones'}),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStack}
        options={{
          title: t('tabs.profile'),
          headerShown: false,
          listeners: ({navigation}) => ({
            tabPress: e => {
              // Siempre resetear al menú de perfil al entrar al tab
              navigation.navigate('Perfil', {screen: 'ProfileHome'});
            },
          }),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  iconWrap: {
    marginBottom: 2,
  },
  icon: {
    fontSize: 18,
  },
  iconInactive: {
    opacity: 0.6,
  },
});
