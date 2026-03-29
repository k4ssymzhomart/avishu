import { useEffect, useRef } from 'react';

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const splashLogo = require('../../../splash-logo.png');

const { width: W, height: H } = Dimensions.get('window');

/*
 * Premium liquid-fill splash.
 *
 * Two black fill layers rise from the bottom of the screen like viscous ink.
 * Each has a smooth meniscus-shaped top edge (SVG bezier curves).
 * The back layer (#111) leads slightly; the front layer (#000) follows.
 * A subtle lateral sway creates organic liquid motion.
 * The white logo reveals naturally once the black fill covers the center.
 *
 * Visual language: monochrome, cinematic, fashion-house minimal.
 */

const WAVE_H = 65;
const FILL_H = H + WAVE_H;
const SVG_EXTRA = 30; // extra width for sway overflow

// Back meniscus — symmetric gentle dome, higher amplitude
const backWave = `M0,${WAVE_H} C${(W + SVG_EXTRA) * 0.2},${-WAVE_H * 0.15} ${(W + SVG_EXTRA) * 0.8},${-WAVE_H * 0.15} ${W + SVG_EXTRA},${WAVE_H} L${W + SVG_EXTRA},${WAVE_H} Z`;

// Front meniscus — asymmetric, slightly offset peak for natural liquid feel
const frontWave = `M0,${WAVE_H} C${(W + SVG_EXTRA) * 0.15},${WAVE_H * 0.25} ${(W + SVG_EXTRA) * 0.5},${-WAVE_H * 0.22} ${W + SVG_EXTRA},${WAVE_H * 0.35} L${W + SVG_EXTRA},${WAVE_H} Z`;

export default function SplashScreen() {
  const router = useRouter();

  // Fill progress  (0 = off-screen bottom, 1 = fully covering)
  const rise1 = useRef(new Animated.Value(0)).current;
  const rise2 = useRef(new Animated.Value(0)).current;

  // Subtle lateral sway (0 → 1 → 0 looping)
  const sway = useRef(new Animated.Value(0)).current;

  // Logo
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.97)).current;

  // Exit
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle perpetual sway — feels like slow viscous liquid
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    swayLoop.start();

    // Phase 1 — liquid fill rises
    const fillAnim = Animated.parallel([
      // Back layer: leads, slightly faster
      Animated.timing(rise1, {
        toValue: 1,
        duration: 1700,
        easing: Easing.bezier(0.33, 0.0, 0.2, 1), // fast-start, gentle settle
        useNativeDriver: true,
      }),
      // Front layer: follows, slightly slower — creates depth
      Animated.timing(rise2, {
        toValue: 1,
        duration: 1900,
        delay: 140,
        easing: Easing.bezier(0.33, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]);

    // Phase 2 — logo emerges from the darkness
    const logoAnim = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        delay: 950,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 850,
        delay: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([fillAnim, logoAnim]).start(() => {
      swayLoop.stop();

      // Phase 3 — hold, then cinematic fade-out
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 380,
        delay: 550,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        router.replace('/landing');
      });
    });

    return () => {
      swayLoop.stop();
    };
  }, [rise1, rise2, sway, logoOpacity, logoScale, screenOpacity, router]);

  /* ---------- Derived animated values ---------- */

  // translateY: FILL_H (off-screen below) → 0 (fully covering)
  const translateY1 = rise1.interpolate({
    inputRange: [0, 1],
    outputRange: [FILL_H, 0],
  });

  const translateY2 = rise2.interpolate({
    inputRange: [0, 1],
    outputRange: [FILL_H, 0],
  });

  // Sway: layers move in opposite directions for organic feel
  const swayX1 = sway.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 14],
  });

  const swayX2 = sway.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -10],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <StatusBar style="light" />

      {/* White canvas — the blank starting state */}
      <View style={styles.whiteBase} />

      {/* ── Back liquid layer ── */}
      <Animated.View
        style={[
          styles.fillLayer,
          { transform: [{ translateY: translateY1 }] },
        ]}
      >
        {/* Meniscus wave edge */}
        <Animated.View
          style={[
            styles.waveWrap,
            { transform: [{ translateX: swayX1 }] },
          ]}
        >
          <Svg
            width={W + SVG_EXTRA}
            height={WAVE_H}
            viewBox={`0 0 ${W + SVG_EXTRA} ${WAVE_H}`}
          >
            <Path d={backWave} fill="#111111" />
          </Svg>
        </Animated.View>
        <View style={[styles.solidFill, { backgroundColor: '#111111' }]} />
      </Animated.View>

      {/* ── Front liquid layer ── */}
      <Animated.View
        style={[
          styles.fillLayer,
          { transform: [{ translateY: translateY2 }] },
        ]}
      >
        {/* Meniscus wave edge — asymmetric for contrast */}
        <Animated.View
          style={[
            styles.waveWrap,
            { transform: [{ translateX: swayX2 }] },
          ]}
        >
          <Svg
            width={W + SVG_EXTRA}
            height={WAVE_H}
            viewBox={`0 0 ${W + SVG_EXTRA} ${WAVE_H}`}
          >
            <Path d={frontWave} fill="#000000" />
          </Svg>
        </Animated.View>
        <View style={[styles.solidFill, { backgroundColor: '#000000' }]} />
      </Animated.View>

      {/* ── White logo — hero element ── */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          resizeMode="contain"
          source={splashLogo}
          style={styles.logo}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fillLayer: {
    bottom: 0,
    height: FILL_H,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  logoWrap: {
    alignSelf: 'center',
    height: 154,
    justifyContent: 'center',
    marginTop: -77,
    position: 'absolute',
    top: '50%',
    width: 308,
    zIndex: 10,
  },
  screen: {
    backgroundColor: '#000000',
    flex: 1,
    overflow: 'hidden',
  },
  solidFill: {
    flex: 1,
  },
  waveWrap: {
    marginHorizontal: -(SVG_EXTRA / 2),
  },
  whiteBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});
