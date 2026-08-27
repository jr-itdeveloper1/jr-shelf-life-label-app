import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { LanguageToggle } from './LanguageToggle';

type Props = {
  label: string;
  onPress: () => void;
  rightContent?: ReactNode;
};

export function StickyBackHeader({ label, onPress, rightContent }: Props) {
  const insets = useSafeAreaInsets();
  const cleanLabel = label.replace(/^<\s*/, '');

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 34) }]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onPress} hitSlop={12}>
          <Text style={styles.backArrow}>{'‹'}</Text>
          <Text style={styles.back}>{cleanLabel}</Text>
        </Pressable>
        <View style={styles.rightContent}>{rightContent ?? <LanguageToggle />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    flexShrink: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingRight: 8,
    paddingVertical: 4,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  backArrow: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 24,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
