import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminListRow } from '../components/AdminListRow';
import { AppIcon } from '../components/AppIcon';
import { LanguageToggle } from '../components/LanguageToggle';
import type { Outlet, ProductCategory } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

type Props = {
  outlets: Outlet[];
  categories: ProductCategory[];
  onSelectOutlet: (outlet: Outlet) => void;
  onAddOutlet: () => void;
  onBack: () => void;
};

export function AdminOutletListScreen({
  outlets,
  categories,
  onSelectOutlet,
  onAddOutlet,
  onBack,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const getCustomCategory = (outlet: Outlet) =>
    categories.find((category) => category.scope === 'outlet' && category.codePrefix === outlet.shortCode);
  const filteredOutlets = outlets.filter((outlet) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [outlet.name, outlet.shortCode, outlet.code].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}><Text style={styles.back} onPress={onBack}>{`‹ ${t('admin')}`}</Text><LanguageToggle /></View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('outlets')}</Text>
        <Pressable style={styles.addButton} onPress={onAddOutlet}>
          <AppIcon name="plus" size={22} color={colors.surface} />
        </Pressable>
      </View>
      <TextInput
        style={styles.searchBox}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('searchOutlet')}
      />
      <FlatList
        data={filteredOutlets}
        keyExtractor={(outlet) => outlet.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const customCategory = getCustomCategory(item);
          return (
            <AdminListRow
              icon="store"
              title={item.name}
              subtitle={t('outletSubtitle', { code: item.shortCode, category: customCategory?.name ?? t('noCustomCategory') })}
              badge={item.shortCode}
              onPress={() => onSelectOutlet(item)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 56,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  searchBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    padding: 14,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
});
