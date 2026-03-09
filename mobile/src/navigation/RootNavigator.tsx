import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/authStore';

// Screens - Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import KYCScreen from '../screens/auth/KYCScreen';
import MFAScreen from '../screens/auth/MFAScreen';

// Screens - Main
import MainTabs from './MainTabs';
import ZelleSendScreen from '../screens/zelle/ZelleSendScreen';
import ZelleReceiveScreen from '../screens/zelle/ZelleReceiveScreen';
import P2PTransferScreen from '../screens/transfer/P2PTransferScreen';
import DepositScreen from '../screens/wallet/DepositScreen';
import ConvertScreen from '../screens/wallet/ConvertScreen';
import USAWithdrawalScreen from '../screens/withdrawal/USAWithdrawalScreen';
import AddBankAccountScreen from '../screens/withdrawal/AddBankAccountScreen';
import MerchantPayScreen from '../screens/merchant/MerchantPayScreen';
import VirtualCardScreen from '../screens/cards/VirtualCardScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  KYC: undefined;
  MFA: {email: string};
  Main: undefined;
  Deposit: undefined;
  Convert: undefined;
  USAWithdrawal: undefined;
  AddBankAccount: undefined;
  ZelleSend: undefined;
  ZelleReceive: undefined;
  P2PTransfer: undefined;
  MerchantPay: {merchantId?: string};
  VirtualCard: undefined;
  TransactionDetail: {id: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isKYCComplete = useAuthStore(s => s.isKYCComplete);
  const needsMFA = useAuthStore(s => s.needsMFA ?? false);
  const user = useAuthStore(s => s.user);

  const showKYCFirst =
    !isKYCComplete &&
    !user?.kycSkipped &&
    user?.kycStatus !== 'UNDER_REVIEW';
  const initialRoute = showKYCFirst ? 'KYC' : 'Main';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : needsMFA ? (
        <Stack.Screen name="MFA" component={MFAScreen} />
      ) : (
        <>
          <Stack.Screen
            name="KYC"
            component={KYCScreen}
            options={{headerShown: true, title: 'Verificación KYC'}}
          />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Deposit"
            component={DepositScreen}
            options={{headerShown: true, title: 'Agregar Bolívares'}}
          />
          <Stack.Screen
            name="Convert"
            component={ConvertScreen}
            options={{headerShown: true, title: 'Convertir'}}
          />
          <Stack.Screen
            name="USAWithdrawal"
            component={USAWithdrawalScreen}
            options={{headerShown: true, title: 'Retiro a USA'}}
          />
          <Stack.Screen
            name="AddBankAccount"
            component={AddBankAccountScreen}
            options={{headerShown: true, title: 'Añadir cuenta USA'}}
          />
          <Stack.Screen
            name="ZelleSend"
            component={ZelleSendScreen}
            options={{headerShown: true, title: 'Enviar a Zelle'}}
          />
          <Stack.Screen
            name="ZelleReceive"
            component={ZelleReceiveScreen}
            options={{headerShown: true, title: 'Recibir Zelle'}}
          />
          <Stack.Screen
            name="P2PTransfer"
            component={P2PTransferScreen}
            options={{headerShown: true, title: 'Transferir P2P'}}
          />
          <Stack.Screen
            name="MerchantPay"
            component={MerchantPayScreen}
            options={{headerShown: true, title: 'Pagar comercio'}}
          />
          <Stack.Screen
            name="VirtualCard"
            component={VirtualCardScreen}
            options={{headerShown: true, title: 'Tarjeta virtual'}}
          />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{headerShown: true, title: 'Detalle'}}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
