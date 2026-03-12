import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useLanguageStore} from '../../store/languageStore';
import {LANGUAGES} from '../../i18n';

export default function LanguageScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const {locale, setLocale} = useLanguageStore();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{t('language.selectLanguage')}</Text>
      {LANGUAGES.map(lang => (
        <TouchableOpacity
          key={lang.code}
          style={[styles.option, locale === lang.code && styles.optionSelected]}
          onPress={() => setLocale(lang.code)}
          activeOpacity={0.7}>
          <Text style={styles.optionText}>
            {lang.flag} {lang.label}
          </Text>
          {locale === lang.code && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', padding: 24},
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionSelected: {borderWidth: 2, borderColor: '#0066CC'},
  optionText: {fontSize: 16, color: '#333'},
  check: {fontSize: 18, color: '#0066CC', fontWeight: 'bold'},
});
