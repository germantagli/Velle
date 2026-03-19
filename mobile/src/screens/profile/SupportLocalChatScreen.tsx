import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  getLocalFaqItems,
  matchLocalFaqAnswer,
  normalizeLocalLocale,
} from '../../data/support-local-faq';

export default function SupportLocalChatScreen(): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const locale = useMemo(
    () => normalizeLocalLocale(i18n.language),
    [i18n.language],
  );
  const faqItems = useMemo(() => getLocalFaqItems(locale), [locale]);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    {id: string; from: 'user' | 'bot'; text: string}[]
  >(() => [
    {
      id: 'welcome',
      from: 'bot',
      text: t('support.localChat.welcome'),
    },
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length >= 1 && prev[0]!.id === 'welcome') {
        return [{...prev[0]!, text: t('support.localChat.welcome')}, ...prev.slice(1)];
      }
      return prev;
    });
  }, [i18n.language, t]);

  const appendExchange = useCallback(
    (userText: string, botText: string) => {
      const uid = `u-${Date.now()}`;
      const bid = `b-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {id: uid, from: 'user', text: userText},
        {id: bid, from: 'bot', text: botText},
      ]);
    },
    [],
  );

  const onChipPress = useCallback(
    (question: string) => {
      const item = faqItems.find(f => f.question === question);
      const answer = item?.answer ?? '';
      if (answer) {
        appendExchange(question, answer);
      }
    },
    [faqItems, appendExchange],
  );

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    setInput('');
    const answer = matchLocalFaqAnswer(locale, trimmed);
    appendExchange(
      trimmed,
      answer ?? t('support.localChat.noMatch'),
    );
  }, [input, locale, appendExchange, t]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('support.localChat.badge')}</Text>
      </View>
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
                msg.from === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot,
              ]}>
              <Text
                style={[
                  styles.chatText,
                  msg.from === 'user' ? styles.chatTextUser : styles.chatTextBot,
                ]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.faqLabel}>{t('support.localChat.chipsTitle')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled">
          {faqItems.map((item, index) => (
            <TouchableOpacity
              key={`${item.question}-${index}`}
              style={styles.chip}
              onPress={() => onChipPress(item.question)}>
              <Text style={styles.chipText} numberOfLines={2}>
                {item.question}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder={t('support.localChat.placeholder')}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0f4f0', padding: 16},
  badge: {
    alignSelf: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '600'},
  chatBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
  },
  chatMessages: {flex: 1},
  chatMessagesContent: {paddingVertical: 4},
  chatBubble: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    maxWidth: '88%',
  },
  chatBubbleUser: {
    marginLeft: '12%',
    backgroundColor: '#1565c0',
  },
  chatBubbleBot: {
    marginRight: '12%',
    backgroundColor: '#e8f5e9',
  },
  chatText: {fontSize: 13},
  chatTextUser: {color: '#fff'},
  chatTextBot: {color: '#1b5e20'},
  faqLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
    marginBottom: 6,
  },
  chipsScroll: {maxHeight: 64, marginBottom: 8},
  chipsRow: {flexDirection: 'row', alignItems: 'center', paddingRight: 8},
  chip: {
    marginRight: 8,
    maxWidth: 220,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  chipText: {fontSize: 12, color: '#1b5e20'},
  chatInputRow: {flexDirection: 'row', alignItems: 'flex-end', marginTop: 4},
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
  sendBtn: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
  },
  sendText: {color: '#fff', fontSize: 18},
});
