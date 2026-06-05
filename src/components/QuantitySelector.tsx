import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  quantity: number;
  onChange: (quantity: number) => void;
};

const PRESETS = [1, 2, 5, 10];

export function QuantitySelector({ quantity, onChange }: Props) {
  const setQuantity = (nextQuantity: number) => {
    onChange(Math.max(1, nextQuantity));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quantity</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepperButton} onPress={() => setQuantity(quantity - 1)}>
            <Text style={styles.stepperText}>-</Text>
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable style={styles.stepperButton} onPress={() => setQuantity(quantity + 1)}>
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset}
            style={[styles.preset, quantity === preset && styles.presetActive]}
            onPress={() => setQuantity(preset)}
          >
            <Text style={[styles.presetText, quantity === preset && styles.presetTextActive]}>
              {preset}
            </Text>
          </Pressable>
        ))}
      </View>
      {quantity > 5 ? (
        <Text style={styles.warning}>Printing more than 5 labels will require confirmation.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preset: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 8,
  },
  presetActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  presetText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  presetTextActive: {
    color: colors.surface,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepperButton: {
    minWidth: 38,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 8,
  },
  stepperText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  quantity: {
    minWidth: 38,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  warning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
});
