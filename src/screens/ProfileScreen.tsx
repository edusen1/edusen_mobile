// ============================================================
// ProfileScreen — user info + logout
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { getMe, logout } from '../lib/api';
import type { MeResponse } from '../types';
import { Colors } from '../lib/colors';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert('Deconnexion', 'Voulez-vous vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Deconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '...';
  const initial = (user?.firstName?.[0] ?? user?.lastName?.[0] ?? 'U').toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{user?.role ?? ''}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
        {user?.telephone && <Text style={styles.phone}>{user.telephone}</Text>}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  role: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  phone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    height: 50,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    marginTop: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
