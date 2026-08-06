// ============================================================
// HistoryScreen — scan history from cache
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllCachedStudents } from '../lib/cache';
import type { CachedStudent } from '../types';
import { Colors } from '../lib/colors';

export default function HistoryScreen() {
  const [scans, setScans] = useState<CachedStudent[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllCachedStudents().then((all) => {
        // Filter out invalid entries (no name)
        const valid = all.filter((s) => {
          const e = s.eleve as Record<string, unknown> | null;
          if (!e) return false;
          const name = [e.firstName, e.lastName].filter(Boolean).join('');
          return name.length > 0;
        });
        setScans(valid);
      }).catch(() => setScans([]));
    }, []),
  );

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (isToday) return time;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${time}`;
  };

  const getClasse = (e: Record<string, unknown>): string => {
    if (typeof e.classe === 'string') return e.classe;
    if (e.classe && typeof e.classe === 'object' && (e.classe as Record<string, unknown>).nom) {
      return String((e.classe as Record<string, unknown>).nom);
    }
    if (e.eleveClasse && typeof e.eleveClasse === 'object' && (e.eleveClasse as Record<string, unknown>).nom) {
      return String((e.eleveClasse as Record<string, unknown>).nom);
    }
    return '';
  };

  const getName = (e: Record<string, unknown>): string => {
    const parts = [e.firstName, e.lastName].filter(Boolean).map(String);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const isOk = (item: CachedStudent): boolean => {
    const e = item.eleve as Record<string, unknown>;
    if (e.actif === false) return false;
    const d = item.dettes as Record<string, unknown> | null;
    if (d && (d.totalDettes as number) > 0) return false;
    return true;
  };

  const todayCount = scans.filter((s) => new Date(s.cachedAt).toDateString() === new Date().toDateString()).length;

  const renderItem = ({ item }: { item: CachedStudent }) => {
    const e = item.eleve as Record<string, unknown>;
    const name = getName(e);
    const matricule = String(e.matricule ?? '');
    const classe = getClasse(e);
    const ok = isOk(item);

    return (
      <View style={styles.row}>
        <View style={[styles.statusIndicator, { backgroundColor: ok ? Colors.green : Colors.red }]}>
          <Text style={styles.statusIcon}>{ok ? '✓' : '✗'}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{name}</Text>
          <Text style={styles.rowDetail}>
            {matricule}{classe ? ` · ${classe}` : ''}
          </Text>
        </View>
        <Text style={styles.rowTime}>{formatTime(item.cachedAt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suivi des scans</Text>
        <Text style={styles.headerCount}>{todayCount} aujourd'hui · {scans.length} total</Text>
      </View>

      {scans.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun scan enregistre</Text>
          <Text style={styles.emptySub}>Scannez une carte pour voir l'historique ici</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.navy },
  headerCount: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  statusIndicator: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    marginRight: 14, borderRadius: 0,
  },
  statusIcon: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.navy },
  rowDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowTime: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.navy },
  emptySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
