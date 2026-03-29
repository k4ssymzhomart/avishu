import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useFranchiseeBottomNav } from '@/hooks/useFranchiseeBottomNav';
import { useFranchiseeWorkspace } from '@/hooks/useFranchiseeWorkspace';
import { useProducts } from '@/hooks/useProducts';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { upsertProduct } from '@/services/products';
import type { Product } from '@/types/product';

type CatalogFormState = {
  availability: Product['availability'];
  category: string;
  imageUrl: string;
  name: string;
  price: string;
  sizes: string;
};

function buildFormState(product: Product | null): CatalogFormState {
  return {
    availability: product?.availability ?? 'in_stock',
    category: product?.category ?? '',
    imageUrl: product?.imageUrl ?? '',
    name: product?.name ?? '',
    price: product ? String(product.price) : '',
    sizes: product?.sizes?.join(', ') ?? '',
  };
}

export default function FranchiseCatalogScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const bottomNavItems = useFranchiseeBottomNav();
  const workspace = useFranchiseeWorkspace();
  const { isLoading, products } = useProducts({
    franchiseId: workspace.franchiseId,
    scope: 'franchise',
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogFormState>(() => buildFormState(null));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isWide = width >= 1080;

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const assignedProductsCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.assignedBranches.includes(workspace.franchiseId) || product.assignedBranches.length === 0,
      ).length,
    [products, workspace.franchiseId],
  );
  const ownedProductsCount = useMemo(
    () => products.filter((product) => product.createdBy === workspace.franchiseId).length,
    [products, workspace.franchiseId],
  );

  useEffect(() => {
    setForm(buildFormState(selectedProduct));
  }, [selectedProduct]);

  const handleSaveProduct = async () => {
    const parsedPrice = Math.max(0, Math.round(Number(form.price.replace(/[^0-9.]/g, ''))));
    const sizes = form.sizes
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean);

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const productId = await upsertProduct({
        assignedBranches:
          selectedProduct?.assignedBranches.length === 0
            ? []
            : Array.from(
                new Set([...(selectedProduct?.assignedBranches ?? []), workspace.franchiseId].filter(Boolean)),
              ),
        availability: form.availability,
        category: form.category.trim() || undefined,
        collection: selectedProduct?.collection ?? workspace.branchName ?? 'AVISHU',
        colors: selectedProduct?.colors ?? [],
        createdBy: selectedProduct?.createdBy ?? workspace.franchiseId,
        description: selectedProduct?.description,
        fit: selectedProduct?.fit,
        id: selectedProduct?.id,
        imageUrl: form.imageUrl.trim() || undefined,
        material: selectedProduct?.material,
        name: form.name.trim() || 'AVISHU Piece',
        preorderLeadDays: form.availability === 'preorder' ? selectedProduct?.preorderLeadDays ?? 10 : undefined,
        price: parsedPrice,
        sizes,
      });

      setSelectedProductId(productId);
    } catch {
      setErrorMessage('Catalog sync paused before the product reached Firestore. Check your project rules and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="orders" items={bottomNavItems} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1180}
      scroll
    >
      <AppHeader
        eyebrow="AVISHU / FRANCHISE"
        onBackPress={() => router.back()}
        showBackButton
        subtitle="Manage the live catalog for your boutique without hardcoded inventory. Global pieces stay available, and boutique-created products can be published into the branch assortment instantly."
        title="Catalog control"
      />

      <View style={styles.summaryStrip}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Visible now</Text>
          <Text style={styles.summaryValue}>{products.length}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Assigned to branch</Text>
          <Text style={styles.summaryValue}>{assignedProductsCount}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Branch-created</Text>
          <Text style={styles.summaryValue}>{ownedProductsCount}</Text>
        </View>
      </View>

      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        <View style={styles.listColumn}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>Live assortment</Text>
              <Text style={styles.sectionBody}>Select a product to edit or start a branch-only piece.</Text>
            </View>
            <Button
              label="New product"
              onPress={() => {
                setSelectedProductId(null);
                setForm(buildFormState(null));
              }}
              size="sm"
              variant="secondary"
            />
          </View>

          {isLoading && !products.length ? (
            <Card padding="lg" variant="muted">
              <Text style={styles.loadingLabel}>Loading catalog...</Text>
            </Card>
          ) : products.length ? (
            <View style={styles.productList}>
              {products.map((product) => {
                const isSelected = product.id === selectedProductId;
                const isGlobal = product.assignedBranches.length === 0;
                const isOwned = product.createdBy === workspace.franchiseId;

                return (
                  <Pressable
                    key={product.id}
                    onPress={() => setSelectedProductId(product.id)}
                    style={({ pressed }) => [
                      styles.productCard,
                      isSelected ? styles.productCardActive : null,
                      pressed ? styles.productCardPressed : null,
                    ]}
                  >
                    <View style={styles.productCardHeader}>
                      <View style={styles.productCardCopy}>
                        <Text style={[styles.productTitle, isSelected ? styles.productTitleActive : null]}>
                          {product.name}
                        </Text>
                        <Text style={[styles.productMeta, isSelected ? styles.productMetaActive : null]}>
                          {`${product.category ?? 'CATALOG'} / ${formatCurrency(product.price)}`}
                        </Text>
                      </View>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, isSelected ? styles.badgeActive : null]}>
                          <Text style={[styles.badgeLabel, isSelected ? styles.badgeLabelActive : null]}>
                            {isOwned ? 'LOCAL' : 'GLOBAL'}
                          </Text>
                        </View>
                        <View style={[styles.badge, isSelected ? styles.badgeActive : null]}>
                          <Text style={[styles.badgeLabel, isSelected ? styles.badgeLabelActive : null]}>
                            {isGlobal ? 'ALL' : `${product.assignedBranches.length} BRANCH`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyState
              description="Create the first boutique product and publish it straight into the branch catalog."
              title="No products yet"
            />
          )}
        </View>

        <View style={styles.formColumn}>
          <Card padding="lg" variant="inverse">
            <Text style={styles.formEyebrow}>{selectedProduct ? 'Edit product' : 'Create branch product'}</Text>
            <Text style={styles.formTitle}>{selectedProduct ? selectedProduct.name : workspace.branchName ?? 'AVISHU Boutique'}</Text>
            <Text style={styles.formBody}>
              Products saved here are written into Firestore with assignment metadata, so customer and franchise views stay in sync.
            </Text>
          </Card>

          <Card padding="lg">
            <Input
              label="Product name"
              onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
              value={form.name}
            />
            <Input
              label="Price (KZT)"
              keyboardType="numeric"
              onChangeText={(value) => setForm((current) => ({ ...current, price: value }))}
              value={form.price}
            />
            <Input
              label="Category"
              onChangeText={(value) => setForm((current) => ({ ...current, category: value }))}
              value={form.category}
            />
            <Input
              label="Image URL"
              autoCapitalize="none"
              onChangeText={(value) => setForm((current) => ({ ...current, imageUrl: value }))}
              value={form.imageUrl}
            />
            <Input
              label="Sizes"
              hint="Use commas, for example XS, S, M, L"
              onChangeText={(value) => setForm((current) => ({ ...current, sizes: value }))}
              value={form.sizes}
            />

            <View style={styles.toggleRow}>
              {(['in_stock', 'preorder'] as const).map((availability) => {
                const isActive = form.availability === availability;

                return (
                  <Pressable
                    key={availability}
                    onPress={() => setForm((current) => ({ ...current, availability }))}
                    style={[styles.toggleChip, isActive ? styles.toggleChipActive : null]}
                  >
                    <Text style={[styles.toggleChipLabel, isActive ? styles.toggleChipLabelActive : null]}>
                      {availability === 'in_stock' ? 'IN STOCK' : 'PREORDER'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.assignmentCard}>
              <Text style={styles.assignmentLabel}>Branch assignment</Text>
              <Text style={styles.assignmentValue}>
                {selectedProduct?.assignedBranches.length === 0
                  ? 'Global product visible in every branch'
                  : `Assigned into ${workspace.branchName ?? 'this boutique'} and any linked branches`}
              </Text>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Button
              disabled={isSaving}
              label={isSaving ? 'Saving...' : selectedProduct ? 'Update product' : 'Create product'}
              onPress={() => {
                void handleSaveProduct();
              }}
            />
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  assignmentCard: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: 4,
    padding: theme.spacing.md,
  },
  assignmentLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  assignmentValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  badge: {
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: theme.spacing.sm,
  },
  badgeActive: {
    borderColor: 'rgba(255,255,255,0.24)',
  },
  badgeLabel: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  badgeLabelActive: {
    color: theme.colors.text.inverseMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  formBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  formColumn: {
    flex: 0.96,
    gap: theme.spacing.lg,
  },
  formEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  formTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  grid: {
    gap: theme.spacing.xl,
  },
  gridWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  listColumn: {
    flex: 1.04,
    gap: theme.spacing.lg,
  },
  loadingLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
  },
  productCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  productCardActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  productCardCopy: {
    flex: 1,
    gap: 4,
  },
  productCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  productCardPressed: {
    opacity: 0.88,
  },
  productList: {
    gap: theme.spacing.sm,
  },
  productMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  productMetaActive: {
    color: theme.colors.text.inverseMuted,
  },
  productTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  productTitleActive: {
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
  toggleChip: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  toggleChipActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  toggleChipLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  toggleChipLabelActive: {
    color: theme.colors.text.inverse,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
