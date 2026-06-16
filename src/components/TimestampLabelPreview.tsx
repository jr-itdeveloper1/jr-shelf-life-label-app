import type { Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatLabelDateOnly, formatLabelTime } from '../domain/shelfLife';
import { timestampLabelBitmapSpec } from '../services/labelBitmap';
import { colors } from '../theme/colors';

type Props = {
  timestamp: Date;
  labelLine: string;
  labelRef?: Ref<View>;
};

export function TimestampLabelPreview({ timestamp, labelLine, labelRef }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timestamp Preview</Text>
      <View style={styles.previewFrame}>
        <View ref={labelRef} collapsable={false} style={styles.label}>
          <View style={styles.labelContent}>
            <Text
              style={styles.labelLineText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              allowFontScaling={false}
            >
              {labelLine}
            </Text>
            <Text
              style={styles.timestampText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.48}
              allowFontScaling={false}
            >
              {formatLabelDateOnly(timestamp)} {formatLabelTime(timestamp)}
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
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  previewFrame: {
    aspectRatio: timestampLabelBitmapSpec.widthMm / timestampLabelBitmapSpec.heightMm,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  label: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  labelContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  labelLineText: {
    width: '100%',
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  timestampText: {
    width: '100%',
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },
});
