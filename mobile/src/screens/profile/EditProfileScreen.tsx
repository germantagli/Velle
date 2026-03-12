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
import {useAuthStore} from '../../store/authStore';
import {userApi} from '../../services/api';
import {AddressAutocomplete} from '../../components/AddressAutocomplete';

export default function EditProfileScreen({navigation}: any): React.JSX.Element {
  const {t} = useTranslation();
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setAddress(user.address ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const {data} = await userApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim() || undefined,
      });
      setAuth({user: {...user!, ...data}});
      Alert.alert(t('common.success'), t('editProfile.profileUpdated'), [
        {text: t('common.ok'), onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || t('editProfile.updateError');
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t('editProfile.firstName')}</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('editProfile.namePlaceholder')}
          editable={!loading}
        />
        <Text style={styles.label}>{t('editProfile.lastName')}</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('editProfile.lastNamePlaceholder')}
          editable={!loading}
        />
        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email ?? ''}
          placeholder={t('auth.email')}
          editable={false}
        />
        <Text style={styles.label}>{t('editProfile.phoneOptional')}</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.phone ?? ''}
          placeholder={t('editProfile.phonePlaceholder')}
          editable={false}
        />
        <Text style={styles.label}>{t('editProfile.address')}</Text>
        <AddressAutocomplete
          value={address}
          onChangeText={setAddress}
          onSelectAddress={setAddress}
          placeholder={t('editProfile.addressPlaceholder')}
          editable={!loading}
        />
        <Text style={styles.hint}>{t('editProfile.emailCannotChange')}</Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('editProfile.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 24},
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
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  hint: {fontSize: 12, color: '#888', marginBottom: 24},
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
