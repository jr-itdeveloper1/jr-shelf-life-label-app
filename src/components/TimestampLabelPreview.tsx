import type { Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLabelDateNumeric, formatLabelTimeNumeric } from '../domain/shelfLife';
import { compactTimestampLabelBitmapSpec, timestampLabelBitmapSpec } from '../services/labelBitmap';
import { colors } from '../theme/colors';

export type TimestampLabelMode = 'full' | 'compact';

type Props = {
  timestamp: Date;
  labelLine: string;
  includeTime?: boolean;
  mode?: TimestampLabelMode;
  onChangeMode?: (mode: TimestampLabelMode) => void;
  labelRef?: Ref<View>;
};

export function TimestampLabelPreview({
  timestamp,
  labelLine,
  includeTime = true,
  mode = 'full',
  onChangeMode,
  labelRef,
}: Props) {
  const previewSpec = mode === 'compact' ? compactTimestampLabelBitmapSpec : timestampLabelBitmapSpec;
  const timestampText = includeTime
    ? formatLabelDateNumeric(timestamp) + ' ' + formatLabelTimeNumeric(timestamp)
    : formatLabelDateNumeric(timestamp);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Timestamp Preview</Text>
        </View>
        {onChangeMode ? (
          <View style={styles.modeSwitch}>
            <Pressable
              style={[styles.modeButton, mode === 'full' && styles.modeButtonActive]}
              onPress={() => onChangeMode('full')}
            >
              <Text style={mode === 'full' ? styles.modeTextActive : styles.modeText}>Normal</Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, mode === 'compact' && styles.modeButtonActive]}
              onPress={() => onChangeMode('compact')}
            >
              <Text style={mode === 'compact' ? styles.modeTextActive : styles.modeText}>Compact</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.previewFrame,
          mode === 'compact' && styles.compactPreviewFrame,
          { aspectRatio: previewSpec.widthMm / previewSpec.heightMm },
        ]}
      >
        <View
          ref={labelRef}
          collapsable={false}
          style={[
            styles.label,
            mode === 'compact' ? styles.compactLabel : styles.normalLabel,
            { aspectRatio: previewSpec.widthMm / previewSpec.heightMm },
          ]}
        >
          <View style={styles.labelContent}>
            <Text
              style={mode === 'compact' ? styles.compactLabelLineText : styles.normalLabelLineText}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={mode === 'compact' ? 0.56 : 0.62}
              allowFontScaling={false}
            >
              {labelLine}
            </Text>
            <Text
              style={mode === 'compact' ? styles.compactTimestampText : styles.normalTimestampText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={mode === 'compact' ? 0.48 : 0.56}
              allowFontScaling={false}
            >
              {timestampText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  modeSwitch: {
    flexShrink: 0,
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 3,
  },
  modeButton: {
    minWidth: 62,
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  modeTextActive: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  previewFrame: {
    alignSelf: 'center',
    width: '100%',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  compactPreviewFrame: {
    width: '72%',
  },
  label: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  normalLabel: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  compactLabel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  labelContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  normalLabelLineText: {
    width: '100%',
    color: '#000000',
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  compactLabelLineText: {
    width: '100%',
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  normalTimestampText: {
    width: '100%',
    color: '#000000',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    textAlign: 'center',
  },
  compactTimestampText: {
    width: '100%',
    color: '#000000',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
});
