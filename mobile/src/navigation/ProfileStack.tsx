import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import TwoFAScreen from '../screens/profile/TwoFAScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SupportScreen from '../screens/profile/SupportScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Security: undefined;
  TwoFA: undefined;
  Notifications: undefined;
  Support: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {backgroundColor: '#fff'},
        headerTitleStyle: {fontWeight: '600', color: '#1a1a2e'},
      }}>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{title: 'Perfil'}}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{title: 'Editar perfil'}}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{title: 'Seguridad'}}
      />
      <Stack.Screen
        name="TwoFA"
        component={TwoFAScreen}
        options={{title: '2FA'}}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{title: 'Notificaciones'}}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{title: 'Soporte'}}
      />
    </Stack.Navigator>
  );
}
