import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useFranchiseeBottomNav } from '@/hooks/useFranchiseeBottomNav';
import { useFranchises } from '@/hooks/useFranchises';
import { useProductionUnits } from '@/hooks/useProductionUnits';
import { theme } from '@/lib/theme/tokens';
import { upsertFranchise } from '@/services/franchises';
import { upsertProductionUnit } from '@/services/productionUnits';
import type { Franchise } from '@/types/franchise';
import type { ProductionUnit } from '@/types/productionUnit';

type FranchiseForm = {
  address: string;
  location: string;
  managerName: string;
  name: string;
  phone: string;
};

type ProductionUnitForm = {
  capacity: string;
  location: string;
  name: string;
  workersCount: string;
};

function buildFranchiseForm(franchise: Franchise | null): FranchiseForm {
  return {
    address: franchise?.address ?? '',
    location: franchise?.location ?? '',
    managerName: franchise?.managerName ?? '',
    name: franchise?.name ?? '',
    phone: franchise?.phone ?? '',
  };
}

function buildProductionUnitForm(unit: ProductionUnit | null): ProductionUnitForm {
  return {
    capacity: unit?.capacity != null ? String(unit.capacity) : '',
    location: unit?.location ?? '',
    name: unit?.name ?? '',
    workersCount: unit?.workersCount != null ? String(unit.workersCount) : '',
  };
}

export default function FranchiseNetworkScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const bottomNavItems = useFranchiseeBottomNav();
  const { franchises, isLoading: isFranchisesLoading } = useFranchises();
  const { isLoading: isUnitsLoading, productionUnits } = useProductionUnits();
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [franchiseForm, setFranchiseForm] = useState<FranchiseForm>(() => buildFranchiseForm(null));
  const [unitForm, setUnitForm] = useState<ProductionUnitForm>(() => buildProductionUnitForm(null));
  const [linkedUnitIds, setLinkedUnitIds] = useState<string[]>([]);
  const [linkedFranchiseIds, setLinkedFranchiseIds] = useState<string[]>([]);
  const [unitStatus, setUnitStatus] = useState<ProductionUnit['status']>('active');
  const [franchiseError, setFranchiseError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [isFranchiseSaving, setIsFranchiseSaving] = useState(false);
  const [isUnitSaving, setIsUnitSaving] = useState(false);
  const isWide = width >= 1120;

  const selectedFranchise = useMemo(
    () => franchises.find((franchise) => franchise.id === selectedFranchiseId) ?? null,
    [franchises, selectedFranchiseId],
  );
  const selectedUnit = useMemo(
    () => productionUnits.find((unit) => unit.id === selectedUnitId) ?? null,
    [productionUnits, selectedUnitId],
  );
  const unitNameById = useMemo(
    () => new Map(productionUnits.map((unit) => [unit.id, unit.name])),
    [productionUnits],
  );
  const franchiseNameById = useMemo(
    () => new Map(franchises.map((franchise) => [franchise.id, franchise.name])),
    [franchises],
  );

  useEffect(() => {
    setFranchiseForm(buildFranchiseForm(selectedFranchise));
    setLinkedUnitIds(selectedFranchise?.productionLinked ?? []);
  }, [selectedFranchise]);

  useEffect(() => {
    setUnitForm(buildProductionUnitForm(selectedUnit));
    setLinkedFranchiseIds(selectedUnit?.linkedFranchises ?? []);
    setUnitStatus(selectedUnit?.status ?? 'active');
  }, [selectedUnit]);

  const toggleLinkedUnit = (unitId: string) => {
    setLinkedUnitIds((current) =>
      current.includes(unitId) ? current.filter((entry) => entry !== unitId) : [...current, unitId],
    );
  };

  const toggleLinkedFranchise = (franchiseId: string) => {
    setLinkedFranchiseIds((current) =>
      current.includes(franchiseId) ? current.filter((entry) => entry !== franchiseId) : [...current, franchiseId],
    );
  };

  const handleSaveFranchise = async () => {
    setFranchiseError(null);
    setIsFranchiseSaving(true);

    try {
      const franchiseId = await upsertFranchise({
        address: franchiseForm.address,
        id: selectedFranchise?.id,
        location: franchiseForm.location,
        managerName: franchiseForm.managerName,
        name: franchiseForm.name,
        phone: franchiseForm.phone,
        productionLinked: linkedUnitIds,
      });

      setSelectedFranchiseId(franchiseId);
    } catch {
      setFranchiseError('The franchise record could not be saved. Check Firestore rules and try again.');
    } finally {
      setIsFranchiseSaving(false);
    }
  };

  const handleSaveUnit = async () => {
    setUnitError(null);
    setIsUnitSaving(true);

    try {
      const unitId = await upsertProductionUnit({
        capacity: unitForm.capacity.trim().length ? Number(unitForm.capacity) : null,
        id: selectedUnit?.id,
        linkedFranchises: linkedFranchiseIds,
        location: unitForm.location,
        name: unitForm.name,
        status: unitStatus,
        workersCount: Number(unitForm.workersCount || 0),
      });

      setSelectedUnitId(unitId);
    } catch {
      setUnitError('The production-unit record could not be saved. Check Firestore rules and try again.');
    } finally {
      setIsUnitSaving(false);
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="dashboard" items={bottomNavItems} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1220}
      scroll
    >
      <AppHeader
        eyebrow="AVISHU / NETWORK"
        onBackPress={() => router.back()}
        showBackButton
        subtitle="A single management surface for franchise records and workshop routing. Active-order totals, linked production units, and workshop capacity stay visible together."
        title="Franchise network"
      />

      <View style={styles.summaryStrip}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Franchises</Text>
          <Text style={styles.summaryValue}>{franchises.length}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Production units</Text>
          <Text style={styles.summaryValue}>{productionUnits.length}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Open network load</Text>
          <Text style={styles.summaryValue}>
            {franchises.reduce((sum, franchise) => sum + franchise.activeOrdersCount, 0)}
          </Text>
        </View>
      </View>

      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        <View style={styles.column}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>Franchises</Text>
              <Text style={styles.sectionBody}>Clean list with order load and linked workshops.</Text>
            </View>
            <Button
              label="New franchise"
              onPress={() => {
                setSelectedFranchiseId(null);
                setFranchiseForm(buildFranchiseForm(null));
                setLinkedUnitIds([]);
              }}
              size="sm"
              variant="secondary"
            />
          </View>

          {isFranchisesLoading && !franchises.length ? (
            <Card padding="lg" variant="muted">
              <Text style={styles.loadingLabel}>Loading franchises...</Text>
            </Card>
          ) : (
            <View style={styles.recordList}>
              {franchises.map((franchise) => {
                const isSelected = franchise.id === selectedFranchiseId;

                return (
                  <Pressable
                    key={franchise.id}
                    onPress={() => setSelectedFranchiseId(franchise.id)}
                    style={({ pressed }) => [
                      styles.recordCard,
                      isSelected ? styles.recordCardActive : null,
                      pressed ? styles.recordCardPressed : null,
                    ]}
                  >
                    <Text style={[styles.recordTitle, isSelected ? styles.recordTitleActive : null]}>{franchise.name}</Text>
                    <Text style={[styles.recordMeta, isSelected ? styles.recordMetaActive : null]}>
                      {`${franchise.location} / ${franchise.activeOrdersCount} open`}
                    </Text>
                    <Text style={[styles.recordSubtle, isSelected ? styles.recordMetaActive : null]}>
                      {franchise.productionLinked.map((unitId) => unitNameById.get(unitId) ?? unitId).join(', ') || 'No linked workshop'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.column}>
          <Card padding="lg">
            <Text style={styles.formEyebrow}>Franchise editor</Text>
            <Input
              label="Name"
              onChangeText={(value) => setFranchiseForm((current) => ({ ...current, name: value }))}
              value={franchiseForm.name}
            />
            <Input
              label="City"
              onChangeText={(value) => setFranchiseForm((current) => ({ ...current, location: value }))}
              value={franchiseForm.location}
            />
            <Input
              label="Address"
              onChangeText={(value) => setFranchiseForm((current) => ({ ...current, address: value }))}
              value={franchiseForm.address}
            />
            <Input
              label="Manager"
              onChangeText={(value) => setFranchiseForm((current) => ({ ...current, managerName: value }))}
              value={franchiseForm.managerName}
            />
            <Input
              label="Phone"
              onChangeText={(value) => setFranchiseForm((current) => ({ ...current, phone: value }))}
              value={franchiseForm.phone}
            />

            <View style={styles.linkGroup}>
              <Text style={styles.linkLabel}>Linked production units</Text>
              <View style={styles.chipWrap}>
                {productionUnits.map((unit) => {
                  const isActive = linkedUnitIds.includes(unit.id);

                  return (
                    <Pressable
                      key={unit.id}
                      onPress={() => toggleLinkedUnit(unit.id)}
                      style={[styles.linkChip, isActive ? styles.linkChipActive : null]}
                    >
                      <Text style={[styles.linkChipLabel, isActive ? styles.linkChipLabelActive : null]}>{unit.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {franchiseError ? <Text style={styles.errorText}>{franchiseError}</Text> : null}

            <Button
              disabled={isFranchiseSaving}
              label={isFranchiseSaving ? 'Saving...' : 'Save franchise'}
              onPress={() => {
                void handleSaveFranchise();
              }}
            />
          </Card>
        </View>
      </View>

      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        <View style={styles.column}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>Production units</Text>
              <Text style={styles.sectionBody}>Workshop detail with capacity, staffing, and linked boutiques.</Text>
            </View>
            <Button
              label="New unit"
              onPress={() => {
                setSelectedUnitId(null);
                setUnitForm(buildProductionUnitForm(null));
                setLinkedFranchiseIds([]);
                setUnitStatus('active');
              }}
              size="sm"
              variant="secondary"
            />
          </View>

          {isUnitsLoading && !productionUnits.length ? (
            <Card padding="lg" variant="muted">
              <Text style={styles.loadingLabel}>Loading production units...</Text>
            </Card>
          ) : (
            <View style={styles.recordList}>
              {productionUnits.map((unit) => {
                const isSelected = unit.id === selectedUnitId;

                return (
                  <Pressable
                    key={unit.id}
                    onPress={() => setSelectedUnitId(unit.id)}
                    style={({ pressed }) => [
                      styles.recordCard,
                      isSelected ? styles.recordCardActive : null,
                      pressed ? styles.recordCardPressed : null,
                    ]}
                  >
                    <Text style={[styles.recordTitle, isSelected ? styles.recordTitleActive : null]}>{unit.name}</Text>
                    <Text style={[styles.recordMeta, isSelected ? styles.recordMetaActive : null]}>
                      {`${unit.location} / ${unit.activeTasks} active / ${unit.status.toUpperCase()}`}
                    </Text>
                    <Text style={[styles.recordSubtle, isSelected ? styles.recordMetaActive : null]}>
                      {unit.linkedFranchises.map((franchiseId) => franchiseNameById.get(franchiseId) ?? franchiseId).join(', ') || 'No linked boutiques'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.column}>
          <Card padding="lg">
            <Text style={styles.formEyebrow}>Production-unit editor</Text>
            <Input
              label="Name"
              onChangeText={(value) => setUnitForm((current) => ({ ...current, name: value }))}
              value={unitForm.name}
            />
            <Input
              label="Location"
              onChangeText={(value) => setUnitForm((current) => ({ ...current, location: value }))}
              value={unitForm.location}
            />
            <Input
              keyboardType="numeric"
              label="Capacity"
              onChangeText={(value) => setUnitForm((current) => ({ ...current, capacity: value }))}
              value={unitForm.capacity}
            />
            <Input
              keyboardType="numeric"
              label="Workers"
              onChangeText={(value) => setUnitForm((current) => ({ ...current, workersCount: value }))}
              value={unitForm.workersCount}
            />

            <View style={styles.linkGroup}>
              <Text style={styles.linkLabel}>Linked franchises</Text>
              <View style={styles.chipWrap}>
                {franchises.map((franchise) => {
                  const isActive = linkedFranchiseIds.includes(franchise.id);

                  return (
                    <Pressable
                      key={franchise.id}
                      onPress={() => toggleLinkedFranchise(franchise.id)}
                      style={[styles.linkChip, isActive ? styles.linkChipActive : null]}
                    >
                      <Text style={[styles.linkChipLabel, isActive ? styles.linkChipLabelActive : null]}>{franchise.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.toggleRow}>
              {(['active', 'busy'] as const).map((status) => {
                const isActive = unitStatus === status;

                return (
                  <Pressable
                    key={status}
                    onPress={() => setUnitStatus(status)}
                    style={[styles.linkChip, isActive ? styles.linkChipActive : null, styles.statusChip]}
                  >
                    <Text style={[styles.linkChipLabel, isActive ? styles.linkChipLabelActive : null]}>{status.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>

            {unitError ? <Text style={styles.errorText}>{unitError}</Text> : null}

            <Button
              disabled={isUnitSaving}
              label={isUnitSaving ? 'Saving...' : 'Save production unit'}
              onPress={() => {
                void handleSaveUnit();
              }}
            />
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  column: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  formEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  grid: {
    gap: theme.spacing.xl,
  },
  gridWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  linkChip: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  linkChipActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  linkChipLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  linkChipLabelActive: {
    color: theme.colors.text.inverse,
  },
  linkGroup: {
    gap: theme.spacing.sm,
  },
  linkLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  loadingLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
  },
  recordCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: 4,
    padding: theme.spacing.md,
  },
  recordCardActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  recordCardPressed: {
    opacity: 0.86,
  },
  recordList: {
    gap: theme.spacing.sm,
  },
  recordMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  recordMetaActive: {
    color: theme.colors.text.inverseMuted,
  },
  recordSubtle: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  recordTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  recordTitleActive: {
    color: theme.colors.text.inverse,
  },
  sectionBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  statusChip: {
    flex: 1,
  },
  summaryCell: {
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 180,
    padding: theme.spacing.lg,
  },
  summaryLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryStrip: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  summaryValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
