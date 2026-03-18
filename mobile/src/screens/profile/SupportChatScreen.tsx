import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  SUPPORT_AI_CHAT_URL,
  SUPPORT_AI_SUGGESTIONS_URL,
} from '../../config/api';

function readSuggestionList(t: TFunction): string[] {
  const raw = t('support.ai.suggestions', {returnObjects: true});
  return Array.isArray(raw) ? (raw as string[]) : [];
}

export default function SupportChatScreen(): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const appLocale = useMemo(
    () => (i18n.language || 'es').split(/[-_]/)[0]!.toLowerCase(),
    [i18n.language],
  );

  const i18nSuggestions = useMemo(() => readSuggestionList(t), [t, i18n.language]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(i18nSuggestions);
  const [messages, setMessages] = useState<
    {id: string; from: 'user' | 'ai'; text: string}[]
  >(() => [
    {
      id: 'welcome',
      from: 'ai',
      text: t('support.ai.welcome'),
    },
  ]);

  useEffect(() => {
    if (i18nSuggestions.length > 0) {
      setSuggestions(i18nSuggestions);
    }
  }, [i18n.language, i18nSuggestions]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length >= 1 && prev[0]!.id === 'welcome') {
        return [
          {...prev[0]!, text: t('support.ai.welcome')},
          ...prev.slice(1),
        ];
      }
      return prev;
    });
  }, [i18n.language, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${SUPPORT_AI_SUGGESTIONS_URL}?locale=${encodeURIComponent(appLocale)}`;
        const res = await fetch(url);
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (
          !cancelled &&
          Array.isArray(data.suggestions) &&
          data.suggestions.length > 0
        ) {
          setSuggestions(data.suggestions as string[]);
        }
      } catch {
        if (!cancelled && i18nSuggestions.length > 0) {
          setSuggestions(i18nSuggestions);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appLocale, i18nSuggestions]);

  const sendWithText = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || sending) {
        return;
      }
      const userId = `user-${Date.now()}`;
      setInput('');
      setMessages(prev => [...prev, {id: userId, from: 'user', text: trimmed}]);
      setSending(true);

      try {
        const response = await fetch(SUPPORT_AI_CHAT_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            message: trimmed,
            locale: appLocale,
          }),
        });

        let reply: string;
        if (response.ok) {
          const data = await response.json();
          reply = data.reply || t('support.ai.genericReply');
        } else {
          reply = t('support.ai.offlineReply');
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
            text: t('support.ai.errorReply'),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, t, appLocale],
  );

  const sendMessage = () => sendWithText(input);

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
        <Text style={styles.faqLabel}>{t('support.ai.faqExamples')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled">
          {suggestions.map((label, index) => (
            <TouchableOpacity
              key={`${label}-${index}`}
              style={styles.chip}
              onPress={() => sendWithText(label)}
              disabled={sending}>
              <Text style={styles.chipText} numberOfLines={2}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder={t('support.ai.chatPlaceholder')}
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
  faqLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
    marginBottom: 6,
  },
  chipsScroll: {
    maxHeight: 64,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  chip: {
    marginRight: 8,
    maxWidth: 220,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#e8eef8',
    borderWidth: 1,
    borderColor: '#c5d4eb',
  },
  chipText: {
    fontSize: 12,
    color: '#1a3a6e',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
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
