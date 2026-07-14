import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export const labelBitmapSpec = {
  widthMm: 60,
  heightMm: 40,
  widthPx: 480,
  heightPx: 320,
  format: 'png',
} as const;

export const timestampLabelBitmapSpec = {
  widthMm: 60,
  heightMm: 40,
  widthPx: 480,
  heightPx: 320,
  format: 'png',
} as const;

export const compactTimestampLabelBitmapSpec = {
  widthMm: 40,
  heightMm: 20,
  widthPx: 320,
  heightPx: 160,
  format: 'png',
} as const;

export const compactProductLabelBitmapSpec = {
  widthMm: 40,
  heightMm: 20,
  widthPx: 320,
  heightPx: 160,
  format: 'png',
} as const;

export type LabelBitmapSpec =
  | typeof labelBitmapSpec
  | typeof timestampLabelBitmapSpec
  | typeof compactTimestampLabelBitmapSpec
  | typeof compactProductLabelBitmapSpec;

export type LabelBitmapFile = {
  uri: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
  format: typeof labelBitmapSpec.format;
};

export async function captureLabelBitmap(
  labelRef: RefObject<View | null>,
  spec: LabelBitmapSpec = labelBitmapSpec,
): Promise<LabelBitmapFile> {
  if (!labelRef.current) {
    throw new Error('Label preview is not ready for bitmap capture.');
  }

  const uri = await captureRef(labelRef.current, {
    format: spec.format,
    quality: 1,
    result: 'tmpfile',
    width: spec.widthPx,
    height: spec.heightPx,
  });

  return {
    uri,
    widthMm: spec.widthMm,
    heightMm: spec.heightMm,
    widthPx: spec.widthPx,
    heightPx: spec.heightPx,
    format: spec.format,
  };
}
