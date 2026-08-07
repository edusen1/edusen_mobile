// ============================================================
// ResultScreen — photo, name, matricule, class, valid icon (centered)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Eleve, DetteSummary } from '../types';
import { scanEleve, verifyCard, isOnline } from '../lib/api';
import type { ScanResponse } from '../lib/api';
import { cacheStudent, getCachedStudent } from '../lib/cache';
import { Colors } from '../lib/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { studentId, cardToken } = route.params;
  const cacheKey = cardToken ?? studentId;

  const [loading, setLoading] = useState(true);
  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [dettes, setDettes] = useState<DetteSummary | null>(null);
  const [scanResult, setScanResult] = useState<string>('');
  const [offline, setOffline] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    load();
  }, [studentId, cardToken]);

  const load = async () => {
    setLoading(true);
    setNotFound(false);

    const online = await isOnline();

    if (online) {
      try {
        if (cardToken) {
          // New secure QR format — call verify-card endpoint
          const result = await verifyCard(cardToken);
          if (result.valid && result.user) {
            const mapped: Eleve = {
              id: result.user.id,
              firstName: result.user.nom.split(' ')[0] ?? null,
              lastName: result.user.nom.split(' ').slice(1).join(' ') || null,
              matricule: result.user.matricule,
              photoUrl: result.user.photoUrl,
              email: null,
              telephone: result.user.telephone,
              role: result.user.role,
              eleveClasse: result.user.classe ? { id: '', nom: result.user.classe } : null,
            };
            setEleve(mapped);
            setDettes(null);
            setScanResult(result.actif ? 'EN_REGLE' : 'INACTIF');
            setOffline(false);
            await cacheStudent(cacheKey, mapped, null);
          } else {
            setNotFound(true);
          }
        } else {
          // Legacy format — call scan endpoint
          const result = await scanEleve(studentId);
          if (result.found && result.eleve) {
            setEleve(result.eleve);
            setDettes(result.dettes);
            setScanResult(result.scanResult);
            setOffline(false);
            await cacheStudent(cacheKey, result.eleve, result.dettes);
          } else {
            const cached = await getCachedStudent(cacheKey);
            if (cached) {
              setEleve(cached.eleve);
              setDettes(cached.dettes);
              setOffline(true);
            } else {
              setNotFound(true);
            }
          }
        }
      } catch {
        const cached = await getCachedStudent(cacheKey);
        if (cached) {
          setEleve(cached.eleve);
          setDettes(cached.dettes);
          setOffline(true);
        } else {
          setNotFound(true);
        }
      }
    } else {
      const cached = await getCachedStudent(cacheKey);
      if (cached) {
        setEleve(cached.eleve);
        setDettes(cached.dettes);
        setOffline(true);
      } else {
        setNotFound(true);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Verification...</Text>
      </View>
    );
  }

  if (notFound || !eleve) {
    return (
      <View style={styles.centered}>
        <View style={[styles.bigIcon, { backgroundColor: Colors.red }]}>
          <Text style={styles.bigIconText}>?</Text>
        </View>
        <Text style={styles.notFoundTitle}>Eleve introuvable</Text>
        <Text style={styles.notFoundSub}>Aucun eleve ne correspond a cet identifiant.</Text>
        <TouchableOpacity style={styles.scanButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.scanButtonText}>Scanner un autre</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = [eleve.firstName, eleve.lastName].filter(Boolean).join(' ') || 'Eleve';
  const classe = (eleve as Record<string, unknown>).classe as string || eleve.eleveClasse?.nom || '';
  const matricule = eleve.matricule || '';
  const hasDebts = dettes && ((dettes as Record<string, unknown>).totalDettes as number) > 0;
  const isOk = scanResult === 'EN_REGLE' || (!scanResult && !hasDebts);

  return (
    <View style={styles.container}>
      {/* Big icon + verdict */}
      <View style={styles.iconSection}>
        <View style={[styles.bigIcon, { backgroundColor: isOk ? Colors.green : Colors.red }]}>
          <Text style={styles.bigIconText}>{isOk ? '✓' : '✗'}</Text>
        </View>
        <Text style={[styles.verdictText, { color: isOk ? Colors.green : Colors.red }]}>
          {isOk ? 'EN REGLE' : scanResult === 'DETTES' ? 'DETTES' : scanResult === 'NON_INSCRIT' ? 'NON INSCRIT' : 'NON EN REGLE'}
        </Text>
        {offline && <Text style={styles.offlineTag}>(hors-ligne)</Text>}
      </View>

      {/* Student info centered */}
      <View style={styles.card}>
        {eleve.photoUrl ? (
          <Image source={{ uri: eleve.photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoInitial}>
              {(eleve.firstName?.[0] ?? eleve.lastName?.[0] ?? 'E').toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.studentName}>{name}</Text>
        {matricule ? <Text style={styles.matriculeText}>{matricule}</Text> : null}
        {classe ? <Text style={styles.classeText}>{classe}</Text> : null}

        {hasDebts && (
          <View style={styles.debtBox}>
            <Text style={styles.debtAmount}>
              {new Intl.NumberFormat('fr-FR').format((dettes as Record<string, unknown>).totalDettes as number)} FCFA
            </Text>
          </View>
        )}
      </View>

      {/* Scan another */}
      <TouchableOpacity style={styles.scanButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Text style={styles.scanButtonText}>Scanner un autre</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayBg,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.grayBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  bigIcon: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  bigIconText: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
  },
  verdictText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: 2,
  },
  offlineTag: {
    fontSize: 12,
    color: Colors.orange,
    marginTop: 6,
    fontWeight: '600',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 0,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    marginBottom: 16,
  },
  photoInitial: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
  },
  matriculeText: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 4,
  },
  classeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  debtBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
    alignItems: 'center',
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.red,
  },
  scanButton: {
    marginTop: 32,
    height: 48,
    width: '100%',
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 20,
  },
  notFoundSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
