// ============================================================
// LoginScreen — big inputs, show/hide password, accessible
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { login, ApiError } from '../lib/api';
import { Colors } from '../lib/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setError('Remplissez les deux champs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(trimmed, password);
      navigation.replace('Main');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Matricule ou mot de passe incorrect.');
        } else if (err.status === 429) {
          setError('Trop de tentatives. Patientez un moment.');
        } else if (err.status && err.status >= 500) {
          setError('Le serveur est temporairement indisponible. Veuillez réessayer plus tard.');
        } else {
          setError('Erreur. Reessayez plus tard.');
        }
      } else {
        setError('Pas de connexion internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo + Title */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.title}>EDUSEN</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Identifier */}
          <Text style={styles.label}>Matricule</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: SEC-001"
            placeholderTextColor="#94a3b8"
            value={identifier}
            onChangeText={(t) => { setIdentifier(t); setError(null); }}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Password */}
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.6}
            >
              <Text style={styles.eyeText}>{showPassword ? 'Masquer' : 'Voir'}</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>CONNEXION</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderRadius: 0,
  },
  logoText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.navy,
    letterSpacing: 4,
  },
  form: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 20,
    borderRadius: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 20,
    borderRadius: 0,
    height: 56,
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.navy,
    borderRadius: 0,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 0,
  },
  eyeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.red,
    padding: 14,
    marginBottom: 20,
    borderRadius: 0,
  },
  errorText: {
    color: Colors.red,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    height: 56,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
