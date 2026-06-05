import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from './AppIcon';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: AppIconName;
  colorSwatch?: string;
  onPress: () => void;
};

export function AdminListRow({ title, subtitle, badge, icon, colorSwatch, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} android_ripple={{ color: colors.surfacePressed, borderless: false }}>
      {colorSwatch ? (
        <View style={styles.swatchBox}>
          <View style={[styles.colorSwatch, { backgroundColor: colorSwatch }]} />
        </View>
      ) : icon ? (
        <View style={styles.iconBox}>
          <AppIcon name={icon} size={21} color={colors.primaryDark} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <AppIcon name="chevronRight" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 13,
    elevation: 1,
  },
  textBlock: {
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  swatchBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '900',
  },
});
