import { useMemo } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import { formatDateLabel } from '@/lib/utils/format';

type CalendarDatePickerProps = {
  availableDates: string[];
  helper?: string;
  label: string;
  locale?: 'en-US' | 'ru-RU';
  onSelect: (value: string) => void;
  selectedDate: string | null;
  selectDateLabel?: string;
  weekdayLabels?: string[];
};

type CalendarCell = {
  available: boolean;
  date: Date;
  inMonth: boolean;
  key: string;
};

function toDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthLabel(date: Date, locale: 'en-US' | 'ru-RU') {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function buildMonthCells(date: Date, availableKeys: Set<string>) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const totalCells = Math.ceil((leadingDays + monthEnd.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const cellDate = new Date(year, month, index - leadingDays + 1);
    const key = toDayKey(cellDate);

    return {
      available: availableKeys.has(key),
      date: cellDate,
      inMonth: cellDate.getMonth() === month,
      key,
    } satisfies CalendarCell;
  });
}

export function CalendarDatePicker({
  availableDates,
  helper,
  label,
  locale = 'en-US',
  onSelect,
  selectedDate,
  selectDateLabel = 'Select a date',
  weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}: CalendarDatePickerProps) {
  const availableKeys = useMemo(
    () => new Set(availableDates.map((value) => toDayKey(value))),
    [availableDates],
  );

  const months = useMemo(() => {
    const grouped = new Map<string, Date>();

    availableDates.forEach((value) => {
      const date = new Date(value);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!grouped.has(key)) {
        grouped.set(key, new Date(date.getFullYear(), date.getMonth(), 1));
      }
    });

    return [...grouped.entries()]
      .sort((left, right) => left[1].getTime() - right[1].getTime())
      .map(([, date]) => ({
        cells: buildMonthCells(date, availableKeys),
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: getMonthLabel(date, locale),
      }));
  }, [availableDates, availableKeys, locale]);

  const selectedKey = selectedDate ? toDayKey(selectedDate) : null;

  if (!months.length) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.label}>{label}</Text>
          {helper ? <Text style={styles.helper}>{helper}</Text> : null}
        </View>
        <Text style={styles.selectedMeta}>
          {selectedDate ? formatDateLabel(selectedDate, { language: locale === 'ru-RU' ? 'ru' : 'en', withYear: true }) : selectDateLabel}
        </Text>
      </View>

      <View style={styles.monthList}>
        {months.map((month) => (
          <View key={month.key} style={styles.monthCard}>
            <Text style={styles.monthTitle}>{month.label}</Text>

            <View style={styles.weekdayRow}>
              {weekdayLabels.map((weekday, index) => (
                <View key={`${month.key}-${weekday}-${index}`} style={styles.weekdayCell}>
                  <Text style={styles.weekdayLabel}>{weekday}</Text>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {month.cells.map((cell) => {
                if (!cell.inMonth) {
                  return <View key={cell.key} style={styles.gridCell} />;
                }

                const isSelected = selectedKey === cell.key;

                return (
                  <View key={cell.key} style={styles.gridCell}>
                    <Pressable
                      disabled={!cell.available}
                      onPress={() => onSelect(cell.key)}
                      style={({ pressed }) => [
                        styles.dateButton,
                        cell.available ? styles.dateButtonAvailable : styles.dateButtonUnavailable,
                        isSelected ? styles.dateButtonSelected : null,
                        pressed && cell.available ? styles.dateButtonPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateLabel,
                          cell.available ? styles.dateLabelAvailable : null,
                          isSelected ? styles.dateLabelSelected : null,
                        ]}
                      >
                        {cell.date.getDate()}
                      </Text>
                      <View
                        style={[
                          styles.dateDot,
                          cell.available ? styles.dateDotAvailable : null,
                          isSelected ? styles.dateDotSelected : null,
                        ]}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 46,
    paddingVertical: theme.spacing.xs,
  },
  dateButtonAvailable: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
  },
  dateButtonPressed: {
    opacity: 0.84,
  },
  dateButtonSelected: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  dateButtonUnavailable: {
    opacity: 0.38,
  },
  dateDot: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    height: 4,
    marginTop: 4,
    width: 4,
  },
  dateDotAvailable: {
    backgroundColor: theme.colors.text.secondary,
  },
  dateDotSelected: {
    backgroundColor: theme.colors.text.inverseMuted,
  },
  dateLabel: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  },
  dateLabelAvailable: {
    color: theme.colors.text.primary,
  },
  dateLabelSelected: {
    color: theme.colors.text.inverse,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  gridCell: {
    width: '13.6%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  helper: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  monthCard: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: 24,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  monthList: {
    gap: theme.spacing.md,
  },
  monthTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
    textTransform: 'capitalize',
  },
  selectedMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  shell: {
    gap: theme.spacing.md,
  },
  weekdayCell: {
    alignItems: 'center',
    width: '13.6%',
  },
  weekdayLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
});
