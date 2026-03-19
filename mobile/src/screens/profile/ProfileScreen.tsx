import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../store/authStore';
import {TWO_FA_ENABLED} from '../../config/features';

export default function ProfileScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
  const {user, logout} = useAuthStore();

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      {text: t('common.cancel'), style: 'cancel'},
      {text: t('auth.logout'), style: 'destructive', onPress: logout},
    ]);
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : t('common.user');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View
          style={[
            styles.kycBadge,
            user?.kycStatus === 'VERIFIED' && styles.kycVerified,
          ]}>
          <Text style={styles.kycText}>
            KYC: {user?.kycStatus ?? 'PENDING'}
          </Text>
        </View>
      </View>
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.menuText}>{t('profile.editProfile')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        {(user?.kycStatus !== 'VERIFIED' && user?.kycStatus !== 'UNDER_REVIEW') && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              const root = (navigation.getParent() as any)?.getParent?.();
              root?.navigate?.('KYC');
            }}>
            <Text style={styles.menuText}>{t('profile.kyc')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Security')}>
          <Text style={styles.menuText}>{t('profile.security')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        {TWO_FA_ENABLED ? (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('TwoFA')}>
            <Text style={styles.menuText}>{t('profile.twoFA')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.menuItem, styles.menuItem2FADisabled]}>
            <View style={styles.menuItemTextCol}>
              <Text style={styles.menuText}>{t('profile.twoFA')}</Text>
              <Text style={styles.menuItemSubtitle}>
                {t('common.comingSoon')}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.menuText}>{t('profile.notifications')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Support')}>
          <Text style={styles.menuText}>{t('profile.support')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Language')}>
          <Text style={styles.menuText}>{t('profile.language')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 48},
  header: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {fontSize: 28, color: '#fff', fontWeight: 'bold'},
  name: {fontSize: 20, fontWeight: 'bold', marginTop: 12, color: '#1a1a2e'},
  email: {fontSize: 14, color: '#666', marginTop: 4},
  kycBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
  },
  kycVerified: {backgroundColor: '#d1fae5'},
  kycText: {fontSize: 12, fontWeight: '600'},
  menu: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden'},
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {fontSize: 16, color: '#333'},
  menuItemTextCol: {flex: 1},
  menuItemSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  /** Fondo gris típico de deshabilitado; el texto igual que el resto del menú. */
  menuItem2FADisabled: {
    backgroundColor: '#f0f0f0',
  },
  menuArrow: {fontSize: 18, color: '#999'},
  logoutBtn: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {fontSize: 16, fontWeight: '600', color: '#ef4444'},
});
