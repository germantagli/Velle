import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

export default function SupportScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<
    {id: string; from: 'user' | 'ai'; text: string}[]
  >([
    {
      id: 'welcome',
      from: 'ai',
      text: t('support.ai.welcome', {
        defaultValue:
          'Hola, soy tu asistente virtual de Velle. ¿En qué puedo ayudarte hoy?',
      }),
    },
  ]);

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
    setChatOpen(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) {
      return;
    }
    const userText = input.trim();
    const userId = `user-${Date.now()}`;
    setInput('');
    setMessages(prev => [...prev, {id: userId, from: 'user', text: userText}]);
    setSending(true);

    try {
      const response = await fetch('https://api.velle.app/support/ai-chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: userText}),
      });

      let reply: string;
      if (response.ok) {
        const data = await response.json();
        reply =
          data.reply ||
          t('support.ai.genericReply', {
            defaultValue:
              'He recibido tu mensaje, un asesor lo revisará en breve.',
          });
      } else {
        reply = t('support.ai.offlineReply', {
          defaultValue:
            'Nuestro asistente inteligente no está disponible ahora mismo. Si es urgente, escríbenos a soporte@velle.app.',
        });
      }

      setMessages(prev => [
        ...prev,
        {id: `ai-${Date.now()}`, from: 'ai', text: reply},
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          from: 'ai',
          text: t('support.ai.errorReply', {
            defaultValue:
              'No se pudo enviar tu mensaje. Revisa tu conexión o usa correo/WhatsApp.',
          }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
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

        {chatOpen && (
          <View style={styles.chatBox}>
            <Text style={styles.chatTitle}>
              {t('support.chatTitle', {defaultValue: 'Asistente virtual'})}
            </Text>
            <ScrollView
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              keyboardShouldPersistTaps="handled">
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.from === 'user'
                      ? styles.chatBubbleUser
                      : styles.chatBubbleAi,
                  ]}>
                  <Text
                    style={[
                      styles.chatText,
                      msg.from === 'user'
                        ? styles.chatTextUser
                        : styles.chatTextAi,
                    ]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder={t('support.chatPlaceholder', {
                  defaultValue: 'Escribe tu pregunta...',
                })}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={sendMessage}
                disabled={sending}>
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.chatSendText}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    </KeyboardAvoidingView>
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
  chatBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  chatMessages: {
    maxHeight: 220,
  },
  chatMessagesContent: {
    paddingVertical: 4,
  },
  chatBubble: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    maxWidth: '85%',
  },
  chatBubbleUser: {
    marginLeft: '15%',
    backgroundColor: '#0066CC',
  },
  chatBubbleAi: {
    marginRight: '15%',
    backgroundColor: '#f0f0f5',
  },
  chatText: {
    fontSize: 13,
  },
  chatTextUser: {
    color: '#fff',
  },
  chatTextAi: {
    color: '#1a1a2e',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fafafa',
  },
  chatSendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
  },
  chatSendText: {
    color: '#fff',
    fontSize: 18,
  },
});
