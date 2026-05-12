import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Outlet } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlets: Outlet[];
  onSelectOutlet: (outlet: Outlet) => void;
};

export function OutletSelectionScreen({ outlets, onSelectOutlet }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>JR Shelf Life Labels</Text>
        <Text style={styles.title}>Select Outlet</Text>
      </View>
      <FlatList
        data={outlets}
        keyExtractor={(outlet) => outlet.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.outletRow} onPress={() => onSelectOutlet(item)}>
            <View>
              <Text style={styles.outletName}>{item.name}</Text>
              <Text style={styles.outletMeta}>Local outlet</Text>
            </View>
            <Text style={styles.shortCode}>{item.shortCode}</Text>
          </Pressable>
        )}
      />
      <Text style={styles.note}>Admin settings are available after outlet selection.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  appName: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    marginTop: 8,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  list: {
    gap: 12,
  },
  outletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  outletName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  outletMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  shortCode: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  note: {
    marginTop: 20,
    color: colors.textMuted,
    fontSize: 13,
  },
});
