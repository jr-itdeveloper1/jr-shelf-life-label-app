import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import type { Outlet } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlets: Outlet[];
  onSelectOutlet: (outlet: Outlet) => void;
};

export function OutletSelectionScreen({ outlets, onSelectOutlet }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 18, 42), paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.appName}>JR Shelf Life Labels</Text>
        <Text style={styles.title}>Select Outlet</Text>
        <Text style={styles.subtitle}>Choose a location to show its available label products.</Text>
      </View>
      <FlatList
        data={outlets}
        keyExtractor={(outlet) => outlet.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={styles.outletRow}
            onPress={() => onSelectOutlet(item)}
            android_ripple={{ color: colors.surfaceMuted, borderless: false }}
          >
            <View style={styles.outletIcon}>
              <AppIcon name="store" size={22} color={colors.primary} />
            </View>
            <View style={styles.outletText}>
              <Text style={styles.outletName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.outletMeta}>Tap to start printing labels</Text>
            </View>
            <Text style={styles.shortCode}>{item.shortCode}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 18,
  },
  appName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  list: {
    gap: 10,
    paddingBottom: 18,
  },
  outletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    elevation: 1,
  },
  outletIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  outletText: {
    flex: 1,
  },
  outletName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  outletMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  shortCode: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
});
