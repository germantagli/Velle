import React from 'react';
import {useTranslation} from 'react-i18next';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import TwoFAScreen from '../screens/profile/TwoFAScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Security: undefined;
  TwoFA: undefined;
  Notifications: undefined;
  Support: undefined;
  Language: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack(): React.JSX.Element {
  const {t} = useTranslation();
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
        options={{title: t('profile.title')}}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{title: t('profile.editProfile')}}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{title: t('profile.security')}}
      />
      <Stack.Screen
        name="TwoFA"
        component={TwoFAScreen}
        options={{title: '2FA'}}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{title: t('profile.notifications')}}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{title: t('profile.support')}}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{title: t('language.title')}}
      />
    </Stack.Navigator>
  );
}
