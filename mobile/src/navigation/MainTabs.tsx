import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import TransferHubScreen from '../screens/transfer/TransferHubScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function MainTabs(): React.JSX.Element {
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
        options={{title: 'Wallet'}}
      />
      <Tab.Screen
        name="Transferir"
        component={TransferHubScreen}
        options={{title: 'Transferencias'}}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{title: 'Historial'}}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStack}
        options={{title: 'Perfil', headerShown: false}}
      />
    </Tab.Navigator>
  );
}
