import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';

export default function ProfileScreen(): React.JSX.Element {
  const {user, logout} = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Cerrar sesión', style: 'destructive', onPress: logout},
    ]);
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'Usuario';

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
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Editar perfil</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Seguridad y 2FA</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Notificaciones</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Soporte / Ayuda</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
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
