import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';

const languages = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'gu' as const, name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language: currentLang, setLanguage, t } = useLanguage();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [showModal, setShowModal] = React.useState(false);

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.buttonText, { color: colors.text, fontFamily: Fonts.medium }]}>
          {currentLanguage.nativeName} ({currentLanguage.code.toUpperCase()})
        </Text>
        <Text style={[styles.arrow, { color: colors.textTertiary }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.semiBold, borderBottomColor: colors.border }]}>
              {t('common.selectLanguage')}
            </Text>
            <ScrollView style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    {
                      backgroundColor: currentLang === lang.code ? `${colors.primary}20` : 'transparent',
                      borderLeftColor: currentLang === lang.code ? colors.primary : 'transparent',
                      borderBottomColor: colors.borderSecondary,
                    },
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageText,
                      {
                        color: currentLang === lang.code ? colors.primary : colors.text,
                        fontFamily: currentLang === lang.code ? Fonts.semiBold : Fonts.regular,
                      },
                    ]}
                  >
                    {lang.nativeName} ({lang.name})
                  </Text>
                  {currentLang === lang.code && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
  },
  arrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: Fonts.sizes.lg,
    padding: 16,
    borderBottomWidth: 1,
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
  },
  languageText: {
    fontSize: Fonts.sizes.base,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    marginLeft: 8,
  },
});

