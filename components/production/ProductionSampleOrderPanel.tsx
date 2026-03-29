import { useMemo, useState } from 'react';

import { Image, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { demoProducts } from '@/lib/constants/demo';
import { theme } from '@/lib/theme/tokens';
import {
  formatDateLabel,
  formatOrderStatus,
  formatOrderType,
} from '@/lib/utils/format';
import {
  createOrder,
  getDefaultFranchiseId,
  updateOrderStatus,
} from '@/services/orders';
import type { Product } from '@/types/product';

type ProductionSampleOrderPanelProps = {
  products?: Product[];
};

type SampleFlowStatus = 'idle' | 'placed' | 'accepted' | 'in_production' | 'ready';
type ActiveSampleStatus = Exclude<SampleFlowStatus, 'idle'>;

type ActiveSample = {
  customerName: string;
  dueDate: string | null;
  imageUrl: string | null;
  orderId: string;
  productName: string;
  status: ActiveSampleStatus;
  type: 'purchase' | 'preorder';
};

const sampleCustomers = [
  {
    address: 'AVISHU Astana Boutique',
    customerId: 'sample-customer-ainur',
    customerName: 'Ainur S.',
    deliveryMethod: 'boutique_pickup' as const,
    note: 'Client will pick up after fitting.',
  },
  {
    address: '29 Mangilik El Ave, Astana',
    customerId: 'sample-customer-dana',
    customerName: 'Dana K.',
    deliveryMethod: 'express_courier' as const,
    note: 'Preorder with evening delivery request.',
  },
  {
    address: '19 Dostyk Ave, Almaty',
    customerId: 'sample-customer-madina',
    customerName: 'Madina A.',
    deliveryMethod: 'city_courier' as const,
    note: 'Send tracking after handoff.',
  },
] as const;

function buildPreferredReadyDate(product: Product) {
  if (product.availability !== 'preorder') {
    return null;
  }

  const leadDays = product.preorderLeadDays ?? 10;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + leadDays);

  return targetDate.toISOString();
}

function getNextStatus(status: ActiveSampleStatus): ActiveSampleStatus | null {
  if (status === 'placed') {
    return 'accepted';
  }

  if (status === 'accepted') {
    return 'in_production';
  }

  if (status === 'in_production') {
    return 'ready';
  }

  return null;
}

function getSampleStatusCopy(sample: ActiveSample | null) {
  if (!sample) {
    return 'Create a sample order using the customer catalog, then move it through the full workflow from this production surface.';
  }

  if (sample.status === 'placed') {
    return 'Order placed. Accept it to hand the garment into the production queue.';
  }

  if (sample.status === 'accepted') {
    return 'Accepted. The task will appear in the queue and can now start production.';
  }

  if (sample.status === 'in_production') {
    return 'On the floor. Complete it to move the garment into the ready board.';
  }

  return 'Ready. The order has reached the finished state and can move forward to franchisee handoff.';
}

export function ProductionSampleOrderPanel({
  products = [],
}: ProductionSampleOrderPanelProps) {
  const [activeSample, setActiveSample] = useState<ActiveSample | null>(null);
  const [nextScenarioIndex, setNextScenarioIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const catalog = products.length ? products : demoProducts;
  const previewProduct = useMemo(
    () => (catalog.length ? catalog[nextScenarioIndex % catalog.length] ?? null : null),
    [catalog, nextScenarioIndex],
  );
  const previewCustomer = sampleCustomers[nextScenarioIndex % sampleCustomers.length];

  const handleCreateSampleOrder = async () => {
    if (!previewProduct) {
      setErrorMessage('No product data is available for sample intake.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      const dueDate = buildPreferredReadyDate(previewProduct);
      const orderId = await createOrder({
        customerId: previewCustomer.customerId,
        customerName: previewCustomer.customerName,
        delivery: {
          address: previewCustomer.address,
          mapPreviewLabel: previewCustomer.address,
          method: previewCustomer.deliveryMethod,
          note: previewCustomer.note,
        },
        franchiseId: getDefaultFranchiseId(),
        preferredReadyDate: dueDate,
        productCollection: previewProduct.collection ?? null,
        productId: previewProduct.id,
        productImageUrl: previewProduct.imageUrl ?? null,
        productName: previewProduct.name,
        productPrice: previewProduct.price,
        type: previewProduct.availability === 'preorder' ? 'preorder' : 'purchase',
      });

      setActiveSample({
        customerName: previewCustomer.customerName,
        dueDate,
        imageUrl: previewProduct.imageUrl ?? null,
        orderId,
        productName: previewProduct.name,
        status: 'placed',
        type: previewProduct.availability === 'preorder' ? 'preorder' : 'purchase',
      });
      setNextScenarioIndex((current) => current + 1);
    } catch {
      setErrorMessage('Sample order could not be created. Check the shared order service connection.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAdvanceSample = async () => {
    if (!activeSample) {
      return;
    }

    const nextStatus = getNextStatus(activeSample.status);

    if (!nextStatus) {
      setActiveSample(null);
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      await updateOrderStatus(activeSample.orderId, nextStatus);
      setActiveSample((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current,
      );
    } catch {
      setErrorMessage('Status update failed before the sample order reached the next stage.');
    } finally {
      setIsBusy(false);
    }
  };

  const nextActionLabel =
    activeSample?.status === 'placed'
      ? 'Accept at boutique'
      : activeSample?.status === 'accepted'
        ? 'Start production'
        : activeSample?.status === 'in_production'
          ? 'Complete to ready'
          : activeSample?.status === 'ready'
            ? 'Ready in board'
            : 'Create sample order';
  const createButtonLabel =
    activeSample?.status === 'ready' ? 'Create next sample' : 'Place sample order';

  return (
    <Card padding="none" style={styles.card}>
      <View style={styles.previewFrame}>
        {activeSample?.imageUrl ?? previewProduct?.imageUrl ? (
          <Image
            resizeMode="cover"
            source={{ uri: activeSample?.imageUrl ?? previewProduct?.imageUrl ?? undefined }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.previewFallback}>
            <Text style={styles.previewFallbackText}>
              {previewProduct?.collection ?? 'AVISHU'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Sample intake</Text>
            <Text style={styles.title}>
              {activeSample?.productName ?? previewProduct?.name ?? 'Customer order'}
            </Text>
            <Text style={styles.subtitle}>
              {activeSample?.customerName ?? previewCustomer.customerName}
            </Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillLabel}>
              {activeSample ? formatOrderStatus(activeSample.status) : 'Ready to place'}
            </Text>
          </View>
        </View>

        <Text style={styles.body}>{getSampleStatusCopy(activeSample)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {formatOrderType(activeSample?.type ?? (previewProduct?.availability === 'preorder' ? 'preorder' : 'purchase'))}
          </Text>
          <Text style={styles.metaText}>
            {activeSample?.dueDate
              ? formatDateLabel(activeSample.dueDate, { withYear: true })
              : previewProduct?.availability === 'preorder'
                ? formatDateLabel(buildPreferredReadyDate(previewProduct), { withYear: true })
                : 'Immediate intake'}
          </Text>
          <Text style={styles.metaText}>
            {activeSample?.orderId ?? 'Not created'}
          </Text>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.actions}>
          <Button
            disabled={isBusy || Boolean(activeSample && activeSample.status !== 'ready')}
            label={isBusy && !activeSample ? 'Creating...' : createButtonLabel}
            onPress={() => {
              if (activeSample?.status === 'ready') {
                void handleCreateSampleOrder();
                return;
              }

              if (!activeSample) {
                void handleCreateSampleOrder();
              }
            }}
            style={styles.actionButton}
            variant={activeSample ? 'ghost' : 'primary'}
          />
          <Button
            disabled={isBusy || !activeSample || activeSample.status === 'ready'}
            label={isBusy && !!activeSample ? `${nextActionLabel}...` : nextActionLabel}
            onPress={() => {
              void handleAdvanceSample();
            }}
            style={styles.actionButton}
            variant="secondary"
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  card: {
    overflow: 'hidden',
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  previewFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  previewFallbackText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  previewFrame: {
    backgroundColor: theme.colors.surface.muted,
    minHeight: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  statusPill: {
    alignItems: 'center',
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  statusPillLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
});
