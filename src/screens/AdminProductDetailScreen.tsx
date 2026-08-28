import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { StickyBackHeader } from '../components/StickyBackHeader';
import { getProductImageSource } from '../data/productImages';
import { getCategoryColor } from '../domain/categoryColors';
import type { Outlet, Product, ProductCategory } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

type Props = {
  product?: Product;
  products: Product[];
  categories: ProductCategory[];
  outlets: Outlet[];
  onSave: (product: Product) => void;
  onBack: () => void;
};

export function AdminProductDetailScreen({
  product,
  products,
  categories,
  outlets,
  onSave,
  onBack,
}: Props) {
  const { t } = useLanguage();
  const firstCategory = categories[0];
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? firstCategory?.id ?? '');
  const [nameEn, setNameEn] = useState(product?.nameEn ?? '');
  const [nameZh, setNameZh] = useState(product?.nameZh ?? '');
  const [storageMethodEn, setStorageMethodEn] = useState(product?.storageMethod.en ?? 'Chilled');
  const [storageMethodZh, setStorageMethodZh] = useState(product?.storageMethod.zh ?? '冷藏');
  const [daysToExpire, setDaysToExpire] = useState(String(product?.daysToExpire ?? 1));
  const [hoursToExpire, setHoursToExpire] = useState(String(product?.hoursToExpire ?? 0));
  const [active, setActive] = useState(product?.active ?? true);
  const [imageUri, setImageUri] = useState(product?.imageUri ?? '');

  const selectedCategory = categories.find((category) => category.id === categoryId) ?? firstCategory;
  const selectedOutlet = selectedCategory?.scope === 'outlet'
    ? outlets.find((outlet) => outlet.shortCode === selectedCategory.codePrefix)
    : undefined;
  const imageSource = getProductImageSource(imageUri);

  const generatedProductCode = useMemo(() => {
    if (!selectedCategory) {
      return '';
    }

    if (product?.categoryId === selectedCategory.id) {
      return product.productCode;
    }

    const nextSequence = products
      .filter((currentProduct) => currentProduct.productCode.startsWith(selectedCategory.codePrefix))
      .map((currentProduct) => Number(currentProduct.productCode.slice(selectedCategory.codePrefix.length)))
      .filter((sequence) => Number.isInteger(sequence))
      .reduce((max, sequence) => Math.max(max, sequence), 0) + 1;

    return `${selectedCategory.codePrefix}${String(nextSequence).padStart(3, '0')}`;
  }, [product, products, selectedCategory]);

  const chooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        legacy: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('imagePickerError'), t('unableOpenImagePicker'));
    }
  };

  const handleSave = () => {
    const trimmedNameEn = nameEn.trim();
    const trimmedNameZh = nameZh.trim();
    const trimmedStorageMethodEn = storageMethodEn.trim();
    const trimmedStorageMethodZh = storageMethodZh.trim();
    const parsedDays = Number(daysToExpire);
    const parsedHours = Number(hoursToExpire);

    if (!selectedCategory) {
      Alert.alert(t('missingCategory'), t('selectCategoryMessage'));
      return;
    }

    if (!trimmedNameEn || !trimmedNameZh) {
      Alert.alert(t('missingName'), t('enterBothProductNames'));
      return;
    }

    if (!trimmedStorageMethodEn || !trimmedStorageMethodZh) {
      Alert.alert(t('missingStorageMethod'), t('enterBothStorageMethods'));
      return;
    }

    if (!Number.isInteger(parsedDays) || !Number.isInteger(parsedHours) || parsedDays < 0 || parsedHours < 0) {
      Alert.alert(t('invalidShelfLife'), t('shelfLifeWholeNumbers'));
      return;
    }

    if (parsedDays === 0 && parsedHours === 0) {
      Alert.alert(t('invalidShelfLife'), t('shelfLifeGreaterZero'));
      return;
    }

    if (selectedCategory.scope === 'outlet' && !selectedOutlet) {
      Alert.alert(t('missingOutlet'), t('missingOutletMessage'));
      return;
    }

    onSave({
      id: product?.id ?? `product-${generatedProductCode.toLowerCase()}-${Date.now()}`,
      outletId: selectedOutlet?.id,
      categoryId: selectedCategory.id,
      productCode: generatedProductCode,
      source: selectedCategory.scope === 'outlet' ? 'outlet' : 'company',
      nameEn: trimmedNameEn,
      nameZh: trimmedNameZh,
      daysToExpire: parsedDays,
      hoursToExpire: parsedHours,
      storageMethod: {
        en: trimmedStorageMethodEn,
        zh: trimmedStorageMethodZh,
      },
      imageUri: imageUri || undefined,
      active,
    });
  };

  return (
    <View style={styles.container}>
      <StickyBackHeader label={t('products')} onPress={onBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{product ? t('productDetail') : t('newProduct')}</Text>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <AppIcon name="save" size={16} color={colors.surface} />
            <Text style={styles.saveText}>{t('save')}</Text>
          </Pressable>
        </View>

        <View style={styles.imagePanel}>
          <Text style={styles.label}>{t('productImage')}</Text>
          <View style={styles.imageBox}>
            {imageSource ? (
              <Image source={imageSource} style={styles.imagePreview} />
            ) : (
              <>
                <Text style={styles.imageText}>{t('optionalImage')}</Text>
                <Text style={styles.imageSubText}>{t('imageFallback')}</Text>
              </>
            )}
          </View>
          <Pressable style={styles.imageAction} onPress={chooseImage}>
            <AppIcon name="image" size={18} color={colors.primary} />
            <Text style={styles.imageActionText}>{t('chooseImage')}</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('category')}</Text>
          <View style={styles.chips}>
            {categories.map((category) => {
              const isActiveCategory = category.id === categoryId;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.chip, isActiveCategory && styles.chipActive]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={[styles.chipText, isActiveCategory && styles.chipTextActive]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ReadOnlyField label={t('productCode')} value={`${generatedProductCode || '-'}  ${t('autoGenerated')}`} />
        {selectedCategory?.scope === 'outlet' ? (
          <ReadOnlyField label={t('outlet')} value={selectedOutlet?.name ?? t('noMatchingOutlet')} />
        ) : null}
        <EditableField label={t('englishName')} value={nameEn} onChangeText={setNameEn} placeholder={t('productName')} />
        <EditableField label={t('chineseName')} value={nameZh} onChangeText={setNameZh} placeholder="中文名称" />
        <EditableField
          label={t('storageMethodEnglish')}
          value={storageMethodEn}
          onChangeText={setStorageMethodEn}
          placeholder="Chilled"
        />
        <EditableField
          label={t('storageMethodChinese')}
          value={storageMethodZh}
          onChangeText={setStorageMethodZh}
          placeholder="冷藏"
        />
        <View style={styles.twoColumn}>
          <EditableField
            label={t('days')}
            value={daysToExpire}
            onChangeText={(value) => setDaysToExpire(value.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
          <EditableField
            label={t('hours')}
            value={hoursToExpire}
            onChangeText={(value) => setHoursToExpire(value.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.label}>{t('status')}</Text>
            <Text style={styles.statusText}>{active ? t('active') : t('inactive')}</Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: colors.border, true: '#9ed9c2' }}
            thumbColor={active ? colors.primary : colors.disabled}
          />
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
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
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
  imagePanel: {
    gap: 10,
  },
  imageBox: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
  },
  imageText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  imageSubText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  imageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingVertical: 10,
  },
  imageActionText: {
    color: colors.primary,
    fontWeight: '900',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  field: {
    flex: 1,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    maxWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  categoryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  chipText: {
    flexShrink: 1,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  chipTextActive: {
    color: colors.surface,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  statusText: {
    marginTop: 5,
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
});
