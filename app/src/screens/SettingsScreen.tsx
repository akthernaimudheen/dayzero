import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { t, type SupportedLanguage } from '@dayzero/shared';
import { api, getCurrentAccount, setServerBaseUrl, getServerBaseUrl } from '../lib/api';
import { COLORS, SPACING } from '../theme';

interface SettingsScreenProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  language,
  onLanguageChange,
  onLogout,
}) => {
  const account = getCurrentAccount();
  const [deletePass, setDeletePass] = useState<string>('');
  const [confirmPhrase, setConfirmPhrase] = useState<string>('');
  const [serverUrlInput, setServerUrlInput] = useState<string>(getServerBaseUrl());
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const handleSaveServerUrl = () => {
    if (!serverUrlInput.trim()) return;
    setServerBaseUrl(serverUrlInput.trim());
    Alert.alert('Server Configured', `Backend server set to: ${serverUrlInput.trim()}`);
  };

  const handleDeleteAccount = async () => {
    if (confirmPhrase.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in capital letters to confirm.');
      return;
    }
    if (!deletePass.trim()) {
      Alert.alert('Password Required', 'Please enter your password to authorize permanent deletion.');
      return;
    }

    Alert.alert(
      'Permanent Data Erasure',
      'All your check-ins, streaks, intentions, and circle posts will be immediately and irreversibly purged from the server database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await api.deleteAccount(deletePass.trim());
              Alert.alert('Account Erased', 'Your account and all associated data have been completely deleted.');
              onLogout();
            } catch (err: any) {
              Alert.alert('Deletion Failed', err.message);
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('nav.settings', language)}</Text>

      {/* Language Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Language / ഭാഷ</Text>
        <Text style={styles.cardSubtitle}>
          Choose your preferred reading language. Transliterated Manglish allows phonetic Malayalam reading in the English alphabet.
        </Text>

        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => onLanguageChange('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, language === 'ml' && styles.langBtnActive]}
            onPress={() => onLanguageChange('ml')}
          >
            <Text style={[styles.langBtnText, language === 'ml' && styles.langBtnTextActive]}>
              മലയാളം (Malayalam)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, language === 'ml-Latn' && styles.langBtnActive]}
            onPress={() => onLanguageChange('ml-Latn')}
          >
            <Text style={[styles.langBtnText, language === 'ml-Latn' && styles.langBtnTextActive]}>
              Manglish (ml-Latn)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backend Server Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Self-Hosted Server Endpoint</Text>
        <Text style={styles.cardSubtitle}>
          Point to your self-hosted PocketBase server or staging environment. Zero vendor lock-in.
        </Text>
        <TextInput
          style={styles.input}
          value={serverUrlInput}
          onChangeText={setServerUrlInput}
          placeholder="http://10.0.2.2:8090 or https://your-server.com"
          placeholderTextColor="#888"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveServerUrl}>
          <Text style={styles.secondaryBtnText}>Save Server URL</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy & Zero Cost Declaration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Privacy & Licensing</Text>
        <Text style={styles.bodyText}>
          &bull; <strong>Zero Paid APIs:</strong> No paid cloud BaaS, no external AI services, no third-party analytics SDKs, and no ad trackers.
        </Text>
        <Text style={styles.bodyText}>
          &bull; <strong>Data Minimization:</strong> Check-ins are tied strictly to your pseudonymous account. Never sold, never shared.
        </Text>
        <Text style={styles.bodyText}>
          &bull; <strong>Offline Fallback:</strong> Emergency advice and verified government care directories are deterministically bundled without requiring live AI generation.
        </Text>
        <Text style={styles.bodyText}>
          &bull; <strong>Full Erasure:</strong> In accordance with Indian Digital Personal Data Protection (DPDP) principles, you can wipe your entire record at any time.
        </Text>
      </View>

      {/* Account Deletion */}
      {account ? (
        <View style={[styles.card, styles.deleteCard]}>
          <Text style={styles.deleteTitle}>Account & Data Erasure</Text>
          <Text style={styles.deleteSubtitle}>
            To permanently wipe your account, type &quot;DELETE&quot; and enter your account password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder='Type "DELETE" to confirm'
            placeholderTextColor="#888"
            value={confirmPhrase}
            onChangeText={setConfirmPhrase}
            autoCapitalize="characters"
          />

          <TextInput
            style={styles.input}
            placeholder="Account Password"
            placeholderTextColor="#888"
            value={deletePass}
            onChangeText={setDeletePass}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            <Text style={styles.deleteBtnText}>
              {deleteLoading ? 'Erasing Data...' : 'Permanently Delete My Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Sign Out Only</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  langRow: {
    flexDirection: 'column',
    gap: 8,
  },
  langBtn: {
    backgroundColor: '#F3F5EE',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBtnActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  langBtnText: {
    fontSize: 14,
    color: COLORS.deepOlive,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  secondaryBtn: {
    backgroundColor: COLORS.paleSage,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.deepOlive,
    fontWeight: '700',
    fontSize: 13,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 8,
  },
  deleteCard: {
    borderColor: '#E8A393',
    backgroundColor: '#FFFBFB',
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9E2A2B',
    marginBottom: 4,
  },
  deleteSubtitle: {
    fontSize: 13,
    color: '#6B3838',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  deleteBtn: {
    backgroundColor: COLORS.terracotta,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
