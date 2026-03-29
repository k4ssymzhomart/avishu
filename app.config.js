const fs = require('node:fs');
const path = require('node:path');

const googleServicesJsonPath = './google-services.json';
const googleServicesPlistPath = './GoogleService-Info.plist';
const expoProjectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;

function fileExists(relativePath) {
  return fs.existsSync(path.join(__dirname, relativePath));
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'AVISHU Superapp',
    slug: 'avishu-superapp',
    scheme: 'avishu',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      ...(fileExists(googleServicesPlistPath)
        ? {
            googleServicesFile: googleServicesPlistPath,
          }
        : null),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      ...(fileExists(googleServicesJsonPath)
        ? {
            googleServicesFile: googleServicesJsonPath,
          }
        : null),
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      [
        'expo-notifications',
        {
          defaultChannel: 'order-status',
          enableBackgroundRemoteNotifications: true,
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
    ],
    ...(expoProjectId
      ? {
          extra: {
            eas: {
              projectId: expoProjectId,
            },
          },
        }
      : null),
  },
};
