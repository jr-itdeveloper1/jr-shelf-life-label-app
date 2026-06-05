import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { StickyBackHeader } from '../components/StickyBackHeader';
import type { Outlet, Product, ProductCategory } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlet?: Outlet;
  outlets: Outlet[];
  categories: ProductCategory[];
  products: Product[];
  onBack: () => void;
  onSave: (outlet: Outlet) => void;
  onDelete?: () => void;
};

export function AdminOutletDetailScreen({
  outlet,
  outlets,
  categories,
  products,
  onBack,
  onSave,
  onDelete,
}: Props) {
  const isNew = !outlet;
  const [name, setName] = useState(outlet?.name ?? '');
  const [shortCode, setShortCode] = useState(outlet?.shortCode ?? '');
  const normalizedShortCode = shortCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const code = normalizedShortCode ? `OUT-${normalizedShortCode}` : '';

  const customCategory = categories.find(
    (category) => category.scope === 'outlet' && category.codePrefix === normalizedShortCode,
  );
  const customProductCount = outlet
    ? products.filter((product) => product.outletId === outlet.id).length
    : 0;

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter an outlet name.');
      return;
    }

    if (!normalizedShortCode) {
      Alert.alert('Missing Short Code', 'Please enter a short code, up to 5 letters or numbers.');
      return;
    }

    const duplicatedShortCode = outlets.some(
      (currentOutlet) =>
        currentOutlet.id !== outlet?.id && currentOutlet.shortCode === normalizedShortCode,
    );

    if (duplicatedShortCode) {
      Alert.alert('Duplicate Short Code', 'Please use a short code that is not already used by another outlet.');
      return;
    }

    onSave({
      id: outlet?.id ?? `outlet-${normalizedShortCode.toLowerCase()}-${Date.now()}`,
      name: trimmedName,
      code,
      shortCode: normalizedShortCode,
    });
  };

  const handleDelete = () => {
    if (!onDelete || !outlet) {
      return;
    }

    Alert.alert('Delete Outlet', `Delete ${outlet.name}? This local action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Outlets" onPress={onBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{isNew ? 'New Outlet' : 'Outlet Detail'}</Text>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <AppIcon name="save" size={16} color={colors.surface} />
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
        <EditableField label="Name" value={name} onChangeText={setName} placeholder="Outlet name" />
        <ReadOnlyField label="Outlet Code" value={code || 'Auto-generated from short code'} />
        <EditableField
          label="Short Code"
          value={shortCode}
          onChangeText={(value) => setShortCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
          placeholder="e.g. ORC"
          autoCapitalize="characters"
        />
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Custom Category</Text>
          <Text style={styles.panelValue}>
            {customCategory?.name ?? (normalizedShortCode ? `${name || 'Outlet'} Custom` : 'Set short code first')}
          </Text>
          <Text style={styles.panelMeta}>Prefix: {normalizedShortCode || '-'}</Text>
          <Text style={styles.panelMeta}>Custom products: {customProductCount}</Text>
        </View>
        <ReadOnlyField label="Status" value="Active" />
        <View style={styles.warningPanel}>
          <Text style={styles.warningTitle}>Short Code Rule</Text>
          <Text style={styles.warningText}>
            The short code is used as the prefix for outlet custom product codes. Changing it later
            may require renumbering custom products.
          </Text>
        </View>
        {!isNew ? (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Outlet</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function EditableField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputLike}>
        <Text style={styles.inputText}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 40,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveText: {
    color: colors.surface,
    fontWeight: '900',
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    padding: 14,
  },
  inputLike: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  inputText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  panel: {
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  panelTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  panelValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  panelMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  warningPanel: {
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#fff7e6',
    borderWidth: 1,
    borderColor: '#f0d49a',
    padding: 14,
  },
  warningTitle: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '900',
  },
  warningText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c2410c',
    backgroundColor: colors.surface,
    paddingVertical: 14,
  },
  deleteText: {
    color: '#c2410c',
    fontSize: 16,
    fontWeight: '900',
  },
});
