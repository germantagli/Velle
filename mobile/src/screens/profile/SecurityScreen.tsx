import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {PasswordInput} from '../../components/PasswordInput';
import {useAuthStore} from '../../store/authStore';
import {authApi, userApi} from '../../services/api';

export default function SecurityScreen({navigation}: any): React.JSX.Element {
  const {t} = useTranslation();
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    userApi
      .getProfile()
      .then(r => {
        const profile = r.data;
        if (profile && user) {
          setAuth({user: {...user, ...profile}});
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const needsInitialPassword = user && user.passwordSet === false;

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('security.fillAllFields'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('security.minChars'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('security.passwordsMismatch'));
      return;
    }
    if (!needsInitialPassword && !currentPassword) {
      Alert.alert(t('common.error'), t('security.enterCurrentPassword'));
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(
        needsInitialPassword ? undefined : currentPassword,
        newPassword,
      );
      if (user) setAuth({user: {...user, passwordSet: true}});
      Alert.alert(t('common.success'), t('security.passwordUpdated'), [
        {text: t('common.ok'), onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || t('security.changeError');
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>
          {needsInitialPassword
            ? t('security.setPassword')
            : t('security.changePassword')}
        </Text>
        {!needsInitialPassword && (
          <>
            <Text style={styles.label}>{t('security.currentPassword')}</Text>
            <PasswordInput
              inputStyle={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('security.currentPasswordPlaceholder')}
              editable={!loading}
            />
          </>
        )}
        <Text style={styles.label}>
          {needsInitialPassword
            ? t('auth.password')
            : t('security.newPassword')}
        </Text>
        <PasswordInput
          inputStyle={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('security.passwordPlaceholder')}
          editable={!loading}
        />
        <Text style={styles.label}>{t('security.confirmPassword')}</Text>
        <PasswordInput
          inputStyle={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('security.repeatPassword')}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('security.updatePassword')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('TwoFA')}>
          <Text style={styles.linkBtnText}>{t('security.setup2FA')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  centered: {justifyContent: 'center', alignItems: 'center'},
  content: {padding: 24},
  sectionTitle: {fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  linkBtn: {paddingVertical: 12},
  linkBtnText: {fontSize: 15, color: '#0066CC', fontWeight: '500'},
});
