import React from 'react';
import {useTranslation} from 'react-i18next';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import TransferHubScreen from '../screens/transfer/TransferHubScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function MainTabs(): React.JSX.Element {
  const {t} = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#666',
        headerShown: true,
        headerStyle: {backgroundColor: '#fff'},
        headerTitleStyle: {fontWeight: '600', color: '#1a1a2e'},
        headerShadowVisible: false,
      }}>
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
        name="Perfil"
        component={ProfileStack}
        options={{title: t('tabs.profile'), headerShown: false}}
      />
    </Tab.Navigator>
  );
}
