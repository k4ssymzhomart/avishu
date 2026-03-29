import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Divider } from '@/components/ui/Divider';
import { theme } from '@/lib/theme/tokens';
import { MapView, Marker, PROVIDER_GOOGLE } from './Map';

const grayscaleMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#151515' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A8A8A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#151515' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2B2B2B' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1D1D1D' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2E2E2E' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#3A3A3A' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4B4B4B' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#242424' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0F0F0F' }] },
];

const karagandaRegion = {
  latitude: 49.8067,
  latitudeDelta: 0.082,
  longitude: 73.085,
  longitudeDelta: 0.082,
} as const;

const branches = [
  {
    activeOrders: 12,
    coordinate: { latitude: 49.8003, longitude: 73.0878 },
    id: 'KRG-01',
    metricLabel: 'Live',
    metricValue: '12',
    name: 'Citymall',
    status: 'Stable',
    zone: 'Bukhar-Zhyrau',
  },
  {
    activeOrders: 8,
    coordinate: { latitude: 49.793, longitude: 73.0947 },
    id: 'KRG-02',
    metricLabel: 'Ready',
    metricValue: '2',
    name: 'Railway',
    status: 'Handoff',
    zone: 'Central station',
  },
  {
    activeOrders: 5,
    coordinate: { latitude: 49.8119, longitude: 73.1285 },
    id: 'KRG-03',
    metricLabel: 'Service',
    metricValue: '91%',
    name: 'South-East',
    status: 'Courier',
    zone: 'Republic Ave',
  },
] as const;

export function FranchiseeBranchMap() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  return (
    <View style={[styles.shell, isWide ? styles.shellWide : null]}>
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapCopy}>
            <Text style={styles.mapEyebrow}>Karaganda branch grid</Text>
            <Text style={styles.mapTitle}>Live branch footprint</Text>
          </View>
        </View>

        <View style={styles.mapFrame}>
          {MapView && Marker ? (
            <MapView
              cacheEnabled
              customMapStyle={grayscaleMapStyle}
              initialRegion={karagandaRegion}
              loadingEnabled
              moveOnMarkerPress={false}
              pitchEnabled={false}
              provider={PROVIDER_GOOGLE}
              rotateEnabled={false}
              showsBuildings={false}
              showsCompass={false}
              showsIndoors={false}
              showsTraffic={false}
              style={styles.map}
              toolbarEnabled={false}
            >
              {branches.map((branch) => (
                <Marker coordinate={branch.coordinate} key={branch.id} tracksViewChanges={false}>
                  <View style={styles.markerShell}>
                    <View style={styles.markerDot} />
                    <View style={styles.markerTag}>
                      <Text style={styles.markerTagText}>{branch.id}</Text>
                    </View>
                  </View>
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackLabel}>Map preview</Text>
              <Text style={styles.mapFallbackBody}>Available on iOS and Android builds.</Text>
            </View>
          )}

          <View pointerEvents="none" style={styles.mapOverlay}>
            <Text style={styles.mapOverlayLabel}>KARAGANDA</Text>
          </View>
        </View>
      </View>

      <View style={styles.branchPanel}>
        <View style={styles.branchPanelCopy}>
          <Text style={styles.branchPanelLabel}>Branches</Text>
          <Text style={styles.branchPanelBody}>A contained mock node window for local handoff context.</Text>
        </View>

        <View style={styles.branchList}>
          {branches.map((branch, index) => (
            <View key={branch.id}>
              {index ? <Divider /> : null}
              <View style={styles.branchRow}>
                <View style={styles.branchRowCopy}>
                  <View style={styles.branchRowTop}>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipLabel}>{branch.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.branchZone}>{branch.zone}</Text>
                </View>

                <View style={styles.branchMetric}>
                  <Text style={styles.branchMetricValue}>{branch.metricValue}</Text>
                  <Text style={styles.branchMetricLabel}>{branch.metricLabel}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.branchFooter}>
          <Text style={styles.branchFooterLabel}>Pipeline held</Text>
          <Text style={styles.branchFooterValue}>{branches.reduce((sum, branch) => sum + branch.activeOrders, 0)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  branchFooter: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  branchFooterLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  branchFooterValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  branchList: {
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
  },
  branchMetric: {
    alignItems: 'flex-end',
    gap: 2,
  },
  branchMetricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  branchMetricValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  branchName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  branchPanel: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    minWidth: 308,
    padding: theme.spacing.lg,
  },
  branchPanelBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  branchPanelCopy: {
    gap: theme.spacing.xs,
  },
  branchPanelLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  branchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  branchRowCopy: {
    flex: 1,
    gap: 4,
    marginRight: theme.spacing.md,
  },
  branchRowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  branchZone: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  map: {
    flex: 1,
  },
  mapCard: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  mapCopy: {
    gap: theme.spacing.xs,
  },
  mapEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  mapFallback: {
    alignItems: 'center',
    backgroundColor: '#151515',
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  mapFallbackBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  mapFallbackLabel: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  mapFrame: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    height: 288,
    overflow: 'hidden',
    position: 'relative',
  },
  mapHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  mapOverlay: {
    left: theme.spacing.md,
    position: 'absolute',
    top: theme.spacing.md,
  },
  mapOverlayLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  mapTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  markerDot: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.text.inverse,
    borderRadius: 999,
    borderWidth: 2,
    height: 12,
    width: 12,
  },
  markerShell: {
    alignItems: 'center',
    gap: 6,
  },
  markerTag: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: theme.colors.border.strong,
    borderRadius: 4,
    borderWidth: theme.borders.width.thin,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markerTagText: {
    color: theme.colors.text.primary,
    fontSize: 10,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  shell: {
    gap: theme.spacing.lg,
  },
  shellWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  statusChip: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  statusChipLabel: {
    color: theme.colors.text.primary,
    fontSize: 10,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
