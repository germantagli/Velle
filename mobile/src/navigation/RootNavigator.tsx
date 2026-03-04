import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/authStore';

// Screens - Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import KYCScreen from '../screens/auth/KYCScreen';
import MFAScreen from '../screens/auth/MFAScreen';

// Screens - Main
import MainTabs from './MainTabs';
import ZelleSendScreen from '../screens/zelle/ZelleSendScreen';
import ZelleReceiveScreen from '../screens/zelle/ZelleReceiveScreen';
import P2PTransferScreen from '../screens/transfer/P2PTransferScreen';
import MerchantPayScreen from '../screens/merchant/MerchantPayScreen';
import VirtualCardScreen from '../screens/cards/VirtualCardScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  KYC: undefined;
  MFA: {email: string};
  Main: undefined;
  ZelleSend: undefined;
  ZelleReceive: undefined;
  P2PTransfer: undefined;
  MerchantPay: {merchantId?: string};
  VirtualCard: undefined;
  TransactionDetail: {id: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const {isAuthenticated, isKYCComplete, needsMFA = false} = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : needsMFA ? (
        <Stack.Screen name="MFA" component={MFAScreen} />
      ) : !isKYCComplete ? (
        <Stack.Screen name="KYC" component={KYCScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ZelleSend" component={ZelleSendScreen} />
          <Stack.Screen name="ZelleReceive" component={ZelleReceiveScreen} />
          <Stack.Screen name="P2PTransfer" component={P2PTransferScreen} />
          <Stack.Screen name="MerchantPay" component={MerchantPayScreen} />
          <Stack.Screen name="VirtualCard" component={VirtualCardScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
