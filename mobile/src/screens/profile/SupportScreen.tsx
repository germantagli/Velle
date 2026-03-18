import React from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../../navigation/ProfileStack';

export default function SupportScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@velle.app').catch(() => {
      Alert.alert('Error', 'No se pudo abrir el correo');
    });
  };

  const handleWhatsApp = () => {
    const phone = '+584141234567'; // Número de soporte a definir
    const message = encodeURIComponent(
      'Hola, necesito ayuda con mi cuenta de Velle.',
    );
    const url = `https://wa.me/${phone.replace('+', '')}?text=${message}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t('support.whatsappErrorTitle', {
          defaultValue: 'No se pudo abrir WhatsApp',
        }),
        t('support.whatsappErrorBody', {
          defaultValue:
            'Verifica que tengas WhatsApp instalado o escríbenos por correo.',
        }),
      );
    });
  };

  const handleOpenChat = () => {
    navigation.navigate('SupportChat');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('support.title', {defaultValue: '¿Necesitas ayuda?'})}
          </Text>
          <Text style={styles.sectionDesc}>
            {t('support.subtitle', {
              defaultValue:
                'Elige cómo prefieres contactar a nuestro equipo de soporte.',
            })}
          </Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={handleEmail}>
          <Text style={styles.cardEmoji}>✉️</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('support.emailTitle', {defaultValue: 'Correo electrónico'})}
            </Text>
            <Text style={styles.cardDesc}>soporte@velle.app</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleWhatsApp}>
          <Text style={styles.cardEmoji}>💬</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('support.whatsappTitle', {defaultValue: 'WhatsApp'})}
            </Text>
            <Text style={styles.cardDesc}>
              {t('support.whatsappDesc', {
                defaultValue: 'Atención rápida desde tu teléfono.',
              })}
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleOpenChat}>
          <Text style={styles.cardEmoji}>🤖</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('support.liveChatTitle', {
                defaultValue: 'Chat en vivo (IA)',
              })}
            </Text>
            <Text style={styles.cardDesc}>
              {t('support.liveChatDesc', {
                defaultValue:
                  'Habla con un asistente inteligente 24/7 para resolver dudas al instante.',
              })}
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('support.footer', {
              defaultValue:
                'Nuestro equipo y nuestro asistente virtual están aquí para ayudarte.',
            })}
          </Text>
          <Text style={styles.footerVersion}>
            {t('support.version', {defaultValue: 'Velle App • Soporte'})}
          </Text>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 24},
  section: {marginBottom: 24},
  sectionTitle: {fontSize: 20, fontWeight: 'bold', color: '#1a1a2e'},
  sectionDesc: {fontSize: 14, color: '#666', marginTop: 8},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardEmoji: {fontSize: 28, marginRight: 16},
  cardContent: {flex: 1},
  cardTitle: {fontSize: 16, fontWeight: '600', color: '#1a1a2e'},
  cardDesc: {fontSize: 13, color: '#666'},
  cardArrow: {fontSize: 20, color: '#999', marginLeft: 8},
  footer: {marginTop: 32, alignItems: 'center'},
  footerText: {fontSize: 13, color: '#999'},
  footerVersion: {fontSize: 12, color: '#bbb', marginTop: 4},
});
