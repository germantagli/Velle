import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SUPPORT_AI_CHAT_URL} from '../../config/api';

export default function SupportChatScreen(): React.JSX.Element {
  const {t} = useTranslation();
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
      const response = await fetch(SUPPORT_AI_CHAT_URL, {
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
      <View style={styles.chatBox}>
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
          <View style={styles.chatSendButton}>
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.chatSendText} onPress={sendMessage}>
                ➤
              </Text>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', padding: 16},
  chatBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
  },
  chatMessages: {
    flex: 1,
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

