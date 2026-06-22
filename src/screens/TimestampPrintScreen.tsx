import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { PrinterReadinessBadge } from '../components/PrinterReadinessBadge';
import { PrintProgressPopup, type PrintProgressStatus } from '../components/PrintProgressPopup';
import { StickyBackHeader } from '../components/StickyBackHeader';
import { TimestampLabelPreview } from '../components/TimestampLabelPreview';
import type { Outlet, PrintJob } from '../domain/models';
import { formatLabelDate, formatLabelDateOnly, formatLabelTime } from '../domain/shelfLife';
import { usePrinterReadiness } from '../hooks/usePrinterReadiness';
import { captureLabelBitmap, timestampLabelBitmapSpec } from '../services/labelBitmap';
import { printLabelBitmap } from '../services/printerService';
import { colors } from '../theme/colors';

type Props = {
  outlet: Outlet;
  onPrint: (printJob: PrintJob) => void;
  onSelectPrinter: () => void;
  onBack: () => void;
  backLabel: string;
};

const defaultTimestampLinePreset = 'USE BY';
const timestampLinePresets = [defaultTimestampLinePreset, 'EXPIRES', 'PREPARED'];
type TimestampLineMode = 'preset' | 'custom';

export function TimestampPrintScreen({ outlet, onPrint, onSelectPrinter, onBack, backLabel }: Props) {
  const insets = useSafeAreaInsets();
  const labelPreviewRef = useRef<View | null>(null);
  const popupCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timestamp, setTimestamp] = useState(() => roundToMinute(new Date()));
  const [timestampLineMode, setTimestampLineMode] = useState<TimestampLineMode>('preset');
  const [timestampLinePreset, setTimestampLinePreset] = useState(defaultTimestampLinePreset);
  const [customTimestampText, setCustomTimestampText] = useState('');
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printError, setPrintError] = useState('');
  const [printPopupStatus, setPrintPopupStatus] = useState<PrintProgressStatus>(null);
  const { readiness: printerReadiness, refreshReadiness } = usePrinterReadiness();
  const trimmedCustomTimestampText = customTimestampText.trim();
  const timestampLabelLine = timestampLineMode === 'preset'
    ? `${timestampLinePreset}: `
    : trimmedCustomTimestampText;
  const shouldSelectPrinter = printerReadiness.status === 'missing';
  const isCheckingPrinter = printerReadiness.status === 'checking';
  const isCustomTimestampTextMissing = timestampLineMode === 'custom' && trimmedCustomTimestampText.length === 0;
  const isPrintDisabled = isPreparingPrint
    || isCheckingPrinter
    || (!shouldSelectPrinter && isCustomTimestampTextMissing);
  const printButtonText = isPreparingPrint
    ? 'Preparing...'
    : isCheckingPrinter
      ? 'Checking Printer...'
      : shouldSelectPrinter
        ? 'Select Printer'
        : 'Print Timestamp';

  useEffect(() => {
    return () => {
      if (popupCloseTimerRef.current) {
        clearTimeout(popupCloseTimerRef.current);
      }
    };
  }, []);

  const clearPopupCloseTimer = () => {
    if (popupCloseTimerRef.current) {
      clearTimeout(popupCloseTimerRef.current);
      popupCloseTimerRef.current = null;
    }
  };

  const showPrintResult = (
    status: Exclude<PrintProgressStatus, 'printing' | null>,
    durationMs: number,
    onClosed?: () => void,
  ) => {
    clearPopupCloseTimer();
    setPrintPopupStatus(status);
    popupCloseTimerRef.current = setTimeout(() => {
      popupCloseTimerRef.current = null;
      setPrintPopupStatus(null);
      onClosed?.();
    }, durationMs);
  };

  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: timestamp,
      mode: 'date',
      display: 'default',
      minimumDate: new Date(2000, 0, 1),
      maximumDate: new Date(2099, 11, 31),
      onChange: (_event, selectedDate) => {
        if (!selectedDate) return;
        setTimestamp((currentTimestamp) => {
          const nextTimestamp = new Date(currentTimestamp);
          nextTimestamp.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          return roundToMinute(nextTimestamp);
        });
        setPrintError('');
      },
    });
  };

  const openTimePicker = () => {
    DateTimePickerAndroid.open({
      value: timestamp,
      mode: 'time',
      display: 'default',
      is24Hour: false,
      onChange: (_event, selectedDate) => {
        if (!selectedDate) return;
        setTimestamp((currentTimestamp) => {
          const nextTimestamp = new Date(currentTimestamp);
          nextTimestamp.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
          return nextTimestamp;
        });
        setPrintError('');
      },
    });
  };

  const resetToCurrentTime = () => {
    const now = roundToMinute(new Date());
    setTimestamp(now);
    setPrintError('');
  };

  const selectTimestampLinePreset = (preset: string) => {
    setTimestampLinePreset(preset);
    setIsPresetMenuOpen(false);
    setPrintError('');
  };

  const selectTimestampLineMode = (mode: TimestampLineMode) => {
    setTimestampLineMode(mode);
    setIsPresetMenuOpen(false);
    setPrintError('');
  };

  const savePrintJob = async () => {
    setPrintError('');
    clearPopupCloseTimer();
    setPrintPopupStatus('printing');
    setIsPreparingPrint(true);
    const printedAt = timestamp;
    const printedLabelLine = timestampLabelLine;
    setTimestamp(printedAt);

    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const bitmap = await captureLabelBitmap(labelPreviewRef, timestampLabelBitmapSpec);
      const printResult = await printLabelBitmap({ bitmap, quantity: 1 });

      onPrint({
        id: `timestamp-${printedAt.getTime()}`,
        labelType: 'timestamp',
        outletId: outlet.id,
        outletName: outlet.name,
        productId: 'timestamp',
        productCode: 'TIME',
        productNameEn: `${printedLabelLine} ${formatLabelDate(printedAt)}`,
        productNameZh: '',
        quantity: 1,
        printedAt: printedAt.toISOString(),
        expiresAt: printedAt.toISOString(),
        labelBitmapUri: printResult.bitmapUri,
        labelBitmapWidthPx: bitmap.widthPx,
        labelBitmapHeightPx: bitmap.heightPx,
        printerName: printResult.printerName,
        printerAddress: printResult.printerAddress,
        status: printResult.status,
      });
      showPrintResult('success', 900);
    } finally {
      setIsPreparingPrint(false);
    }
  };

  const handlePrint = () => {
    if (shouldSelectPrinter) {
      onSelectPrinter();
      return;
    }

    if (isPrintDisabled) {
      return;
    }

    void savePrintJob().catch((error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Could not send the timestamp to the Bluetooth printer. Check pairing and try again.';
      showPrintResult('warning', 1300, () => setPrintError(errorMessage));
    });
  };

  return (
    <View style={styles.container}>
      <PrintProgressPopup status={printPopupStatus} />
      <StickyBackHeader
        label={backLabel}
        onPress={onBack}
        rightContent={<PrinterReadinessBadge readiness={printerReadiness} onRefresh={refreshReadiness} />}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.label}>Current Outlet</Text>
          <Text style={styles.outletName}>{outlet.name}</Text>
          <Text style={styles.note}>This compact label prints the selected line and timestamp shown in the preview.</Text>
        </View>
        <TimestampLabelPreview labelRef={labelPreviewRef} timestamp={timestamp} labelLine={timestampLabelLine} />
        <View style={styles.editorCard}>
          <View style={styles.editorHeader}>
            <View>
              <Text style={styles.editorTitle}>Edit Timestamp</Text>
              <Text style={styles.editorSubtitle}>Changes update the preview above.</Text>
            </View>
            <Pressable style={styles.nowButton} onPress={resetToCurrentTime}>
              <Text style={styles.nowButtonText}>Now</Text>
            </Pressable>
          </View>
          <View style={styles.lineModeSwitch}>
            <Pressable
              style={[styles.lineModeButton, timestampLineMode === 'preset' && styles.lineModeButtonActive]}
              onPress={() => selectTimestampLineMode('preset')}
            >
              <Text style={[styles.lineModeText, timestampLineMode === 'preset' && styles.lineModeTextActive]}>Preset</Text>
            </Pressable>
            <Pressable
              style={[styles.lineModeButton, timestampLineMode === 'custom' && styles.lineModeButtonActive]}
              onPress={() => selectTimestampLineMode('custom')}
            >
              <Text style={[styles.lineModeText, timestampLineMode === 'custom' && styles.lineModeTextActive]}>Custom</Text>
            </Pressable>
          </View>
          {timestampLineMode === 'preset' ? (
            <View style={styles.lineEditorSingle}>
              <View style={styles.presetColumn}>
                <Pressable
                  style={[styles.presetButton, isPresetMenuOpen && styles.presetButtonActive]}
                  onPress={() => setIsPresetMenuOpen((isOpen) => !isOpen)}
                >
                  <Text style={styles.presetLabel}>Label</Text>
                  <View style={styles.presetValueRow}>
                    <Text style={styles.presetValue} numberOfLines={1}>{formatTimestampPresetLabel(timestampLinePreset)}</Text>
                    <Text style={styles.presetChevron}>v</Text>
                  </View>
                </Pressable>
                {isPresetMenuOpen ? (
                  <View style={styles.presetMenu}>
                    {timestampLinePresets.map((preset) => (
                      <Pressable
                        key={preset}
                        style={[
                          styles.presetMenuItem,
                          preset === timestampLinePreset && styles.presetMenuItemActive,
                        ]}
                        onPress={() => selectTimestampLinePreset(preset)}
                      >
                        <Text
                          style={[
                            styles.presetMenuText,
                            preset === timestampLinePreset && styles.presetMenuTextActive,
                          ]}
                        >
                          {formatTimestampPresetLabel(preset)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.lineEditorSingle}>
              <View style={styles.customTextField}>
                <Text style={styles.pickerLabel}>Custom Text</Text>
                <TextInput
                  style={styles.customTextInput}
                  value={customTimestampText}
                  onChangeText={(value) => {
                    setCustomTimestampText(value);
                    setPrintError('');
                  }}
                  autoCapitalize="characters"
                  maxLength={24}
                />
              </View>
            </View>
          )}
          <View style={styles.pickerRow}>
            <Pressable style={styles.pickerButton} onPress={openDatePicker}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Text style={styles.pickerValue}>{formatLabelDateOnly(timestamp)}</Text>
            </Pressable>
            <Pressable style={styles.pickerButton} onPress={openTimePicker}>
              <Text style={styles.pickerLabel}>Time</Text>
              <Text style={styles.pickerValue}>{formatLabelTime(timestamp)}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        {printError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Print Error</Text>
            <Text style={styles.errorText}>{printError}</Text>
          </View>
        ) : null}
        <Pressable
          disabled={isPrintDisabled}
          style={[styles.printButton, isPrintDisabled && styles.printButtonDisabled]}
          onPress={handlePrint}
        >
          <AppIcon name={shouldSelectPrinter ? 'printer' : 'print'} size={20} color={colors.surface} />
          <Text style={styles.printText}>{printButtonText}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function roundToMinute(value: Date) {
  const rounded = new Date(value);
  rounded.setSeconds(0, 0);
  return rounded;
}

function formatTimestampPresetLabel(preset: string) {
  return `${preset}:`;
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  summary: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  outletName: {
    marginTop: 2,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  note: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  editorCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  editorTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  editorSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  nowButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nowButtonText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  lineModeSwitch: {
    marginTop: 14,
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  lineModeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  lineModeButtonActive: {
    backgroundColor: colors.primary,
  },
  lineModeText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  lineModeTextActive: {
    color: colors.surface,
  },
  lineEditorSingle: {
    marginTop: 14,
  },
  presetColumn: {
    width: '100%',
    zIndex: 2,
  },
  presetButton: {
    height: 66,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  presetButtonActive: {
    borderColor: colors.primary,
  },
  presetLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  presetValueRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetValue: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  presetChevron: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  presetMenu: {
    position: 'absolute',
    top: 67,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    elevation: 8,
    zIndex: 4,
  },
  presetMenuItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  presetMenuItemActive: {
    backgroundColor: colors.primarySoft,
  },
  presetMenuText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  presetMenuTextActive: {
    color: colors.primaryDark,
    fontWeight: '900',
  },
  customTextField: {
    minHeight: 66,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customTextInput: {
    marginTop: 2,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    padding: 0,
  },
  pickerRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pickerValue: {
    marginTop: 5,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorBanner: {
    borderRadius: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorTitle: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 2,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
  },
  printButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  printText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
});

