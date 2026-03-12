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

export default function SupportScreen(): React.JSX.Element {
  const handleEmail = () => {
    Linking.openURL('mailto:soporte@velle.app').catch(() => {
      Alert.alert('Error', 'No se pudo abrir el correo');
    });
  };

  const handleFAQ = () => {
    Alert.alert(
      'Preguntas frecuentes',
      '¿Cómo agrego bolívares? Ve a Agregar VES, ingresa el monto y realiza el pago móvil con la referencia.\n\n¿Cómo transfiero a otro usuario? Ve a Transferir y busca por nombre, email o teléfono.\n\n¿Cómo cambio mi contraseña? Perfil → Seguridad → Cambiar contraseña.',
      [{text: 'Entendido'}],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Necesitas ayuda?</Text>
        <Text style={styles.sectionDesc}>
          Estamos aquí para ayudarte con cualquier duda sobre tu cuenta.
        </Text>
      </View>
      <TouchableOpacity style={styles.card} onPress={handleFAQ}>
        <Text style={styles.cardEmoji}>❓</Text>
        <Text style={styles.cardTitle}>Preguntas frecuentes</Text>
        <Text style={styles.cardDesc}>
          Consulta las dudas más comunes
        </Text>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={handleEmail}>
        <Text style={styles.cardEmoji}>✉️</Text>
        <Text style={styles.cardTitle}>{t('support.contactSupport')}</Text>
        <Text style={styles.cardDesc}>
          soporte@velle.app
        </Text>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('support.footer')}</Text>
        <Text style={styles.footerVersion}>{t('support.version')}</Text>
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
  cardTitle: {fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1},
  cardDesc: {fontSize: 13, color: '#666'},
  cardArrow: {fontSize: 20, color: '#999', marginLeft: 8},
  footer: {marginTop: 32, alignItems: 'center'},
  footerText: {fontSize: 13, color: '#999'},
  footerVersion: {fontSize: 12, color: '#bbb', marginTop: 4},
});
