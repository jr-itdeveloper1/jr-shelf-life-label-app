import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { StickyBackHeader } from '../components/StickyBackHeader';
import { categoryColorOptions, getCategoryColor } from '../domain/categoryColors';
import type { Product, ProductCategory } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  category?: ProductCategory;
  categories: ProductCategory[];
  products: Product[];
  onSave: (category: ProductCategory) => void;
  onBack: () => void;
};

export function AdminCategoryDetailScreen({
  category,
  categories,
  products,
  onSave,
  onBack,
}: Props) {
  const [name, setName] = useState(category?.name ?? '');
  const [codePrefix, setCodePrefix] = useState(category?.codePrefix ?? '');
  const [scope, setScope] = useState<ProductCategory['scope']>(category?.scope ?? 'company');
  const [categoryColor, setCategoryColor] = useState(getCategoryColor(category ?? 'tag'));
  const productCount = category
    ? products.filter((product) => product.categoryId === category.id).length
    : 0;
  const normalizedPrefix = codePrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter a category name.');
      return;
    }

    if (!normalizedPrefix) {
      Alert.alert('Missing Prefix', 'Please enter a prefix, up to 5 letters or numbers.');
      return;
    }

    const duplicatedPrefix = categories.some(
      (currentCategory) =>
        currentCategory.id !== category?.id && currentCategory.codePrefix === normalizedPrefix,
    );

    if (duplicatedPrefix) {
      Alert.alert('Duplicate Prefix', 'Please use a prefix that is not already used by another category.');
      return;
    }

    onSave({
      id: category?.id ?? `category-${normalizedPrefix.toLowerCase()}-${Date.now()}`,
      name: trimmedName,
      codePrefix: normalizedPrefix,
      color: categoryColor,
      scope,
    });
  };

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Categories" onPress={onBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{category ? 'Category Detail' : 'New Category'}</Text>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <AppIcon name="save" size={16} color={colors.surface} />
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
        <EditableField label="Name" value={name} onChangeText={setName} placeholder="Category name" />
        <EditableField
          label="Code Prefix"
          value={codePrefix}
          onChangeText={(value) => setCodePrefix(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
          placeholder="e.g. DAI"
          autoCapitalize="characters"
        />
        <View style={styles.field}>
          <Text style={styles.label}>Colour</Text>
          <View style={styles.colorGrid}>
            {categoryColorOptions.map((option) => {
              const isSelected = option.color === categoryColor;
              const isWhite = option.color.toLowerCase() === '#ffffff';
              return (
                <Pressable
                  key={option.color}
                  style={[
                    styles.colorOption,
                    isSelected && styles.colorOptionActive,
                  ]}
                  onPress={() => setCategoryColor(option.color)}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: option.color },
                      isWhite && styles.whiteColorDot,
                    ]}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.colorOptionText, isSelected && styles.colorOptionTextActive]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Scope</Text>
          <View style={styles.segmented}>
            <Text
              style={[styles.segment, scope === 'company' && styles.segmentActive]}
              onPress={() => setScope('company')}
            >
              Company
            </Text>
            <Text
              style={[styles.segment, scope === 'outlet' && styles.segmentActive]}
              onPress={() => setScope('outlet')}
            >
              Outlet Custom
            </Text>
          </View>
        </View>
        <ReadOnlyField label="Status" value="Active" />
        <ReadOnlyField label="Products in category" value={`${productCount}`} />
        <View style={styles.prefixPanel}>
          <Text style={styles.panelTitle}>Prefix Change</Text>
          <Text style={styles.panelText}>Current behavior:</Text>
          <Text style={styles.optionActive}>Future products only</Text>
          <Text style={styles.warning}>
            Existing product codes are not renumbered yet. We can add the renumber preview flow when product persistence is moved to SQLite.
          </Text>
        </View>
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
    flex: 1,
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
    fontSize: 17,
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
    fontSize: 17,
    fontWeight: '800',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surface,
    fontWeight: '800',
  },
  segmentActive: {
    color: colors.surface,
    backgroundColor: colors.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: '31.8%',
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 9,
  },
  colorOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#e7f4ee',
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whiteColorDot: {
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  colorOptionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  colorOptionTextActive: {
    color: colors.primaryDark,
  },
  prefixPanel: {
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  panelText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  optionActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  warning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
