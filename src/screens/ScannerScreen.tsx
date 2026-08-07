// ============================================================
// ScannerScreen — edusen_mobile
// QR code scanner using expo-camera
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { Colors } from '../lib/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SCAN_SIZE = 260;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScannerScreen() {
  const navigation = useNavigation<NavProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    // Reset scanned state when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      processingRef.current = false;
    });
    return unsubscribe;
  }, [navigation]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (processingRef.current) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let studentId: string | null = null;
    let cardToken: string | null = null;

    // Try 1: URL with card token (new format)
    // e.g. https://edusen-api.assanediallo.com/api/admin/verify-card/abc123def456...
    const tokenMatch = data.match(/\/verify-card\/([a-f0-9]{32})$/i);
    if (tokenMatch) {
      cardToken = tokenMatch[1];
    }

    // Try 2: plain UUID (legacy)
    if (!cardToken && uuidRegex.test(data.trim())) {
      studentId = data.trim();
    }

    // Try 3: JSON payload (legacy {"type":"EDUSEN_ID_CARD","userId":"..."})
    if (!cardToken && !studentId) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.token) {
          cardToken = parsed.token;
        } else if (parsed.userId && uuidRegex.test(parsed.userId)) {
          studentId = parsed.matricule || parsed.userId;
        }
      } catch {
        // Not JSON — ignore
      }
    }

    if (!cardToken && !studentId) {
      if (!scanned) {
        setScanned(true);
        Alert.alert(
          'QR Code invalide',
          'Ce QR code ne contient pas un identifiant etudiant valide.',
          [{ text: 'Reessayer', onPress: () => setScanned(false) }],
        );
      }
      return;
    }

    processingRef.current = true;
    setScanned(true);
    navigation.navigate('Result', { studentId: studentId ?? '', cardToken: cardToken ?? undefined });
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Camera requise</Text>
          <Text style={styles.permissionText}>
            L'application a besoin d'acceder a la camera pour scanner les QR codes des cartes etudiantes.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Autoriser la camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scanner QR</Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay with cutout */}
        <View style={styles.overlay}>
          {/* Top */}
          <View style={styles.overlayRow} />

          {/* Middle row with cutout */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>

          {/* Bottom */}
          <View style={styles.overlayRow}>
            <Text style={styles.instructions}>
              Placez le QR code de la carte etudiante dans le cadre
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.grayBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.navy,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  logoutText: {
    color: Colors.red,
    fontSize: 14,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
  overlayRow: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  scanArea: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.accent,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructions: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 24,
  },
  permissionCard: {
    backgroundColor: Colors.white,
    padding: 32,
    alignItems: 'center',
    borderRadius: 0,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 0,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
