import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      <Pressable accessibilityRole="radio" accessibilityLabel="English" accessibilityState={{ checked: language === 'en' }} onPress={() => setLanguage('en')} style={[styles.option, language === 'en' && styles.optionActive]}><Text style={[styles.text, language === 'en' && styles.textActive]}>EN</Text></Pressable>
      <Pressable accessibilityRole="radio" accessibilityLabel="简体中文" accessibilityState={{ checked: language === 'zh-CN' }} onPress={() => setLanguage('zh-CN')} style={[styles.option, language === 'zh-CN' && styles.optionActive]}><Text style={[styles.text, language === 'zh-CN' && styles.textActive]}>中文</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 34, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surfaceMuted, padding: 2 },
  option: { minWidth: 38, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 6, paddingHorizontal: 7 },
  optionActive: { backgroundColor: colors.primary }, text: { color: colors.textMuted, fontSize: 12, fontWeight: '900' }, textActive: { color: colors.surface },
});
