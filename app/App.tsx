import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { t, type SupportedLanguage } from '@dayzero/shared';
import { COLORS } from './src/theme';
import { CompanionScreen } from './src/screens/CompanionScreen';
import { CareDirectoryScreen } from './src/screens/CareDirectoryScreen';
import { HelplinesScreen } from './src/screens/HelplinesScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { EmergencyModal } from './src/components/EmergencyModal';
import { api } from './src/lib/api';

type TabType = 'companion' | 'care' | 'helplines' | 'community' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('companion');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [emergencyOpen, setEmergencyOpen] = useState<boolean>(false);

  const handleLogout = () => {
    api.logout();
    setActiveTab('companion');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.deepOlive} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>DayZero</Text>
          <Text style={styles.brandSubtitle}>തണൽ &bull; Recovery Platform</Text>
        </View>

        <TouchableOpacity
          style={styles.emergencyPill}
          onPress={() => setEmergencyOpen(true)}
          accessibilityLabel="Open Emergency 112 Help"
        >
          <Text style={styles.emergencyPillText}>SOS 112</Text>
        </TouchableOpacity>
      </View>

      {/* Active Screen Body */}
      <View style={styles.mainContent}>
        {activeTab === 'companion' && (
          <CompanionScreen
            language={language}
            onNavigateTab={(tab) => setActiveTab(tab as TabType)}
            onOpenEmergency={() => setEmergencyOpen(true)}
          />
        )}
        {activeTab === 'care' && (
          <CareDirectoryScreen language={language} />
        )}
        {activeTab === 'helplines' && (
          <HelplinesScreen language={language} />
        )}
        {activeTab === 'community' && (
          <CommunityScreen language={language} />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            language={language}
            onLanguageChange={setLanguage}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Emergency Guidance Modal */}
      <EmergencyModal
        visible={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />

      {/* Bottom Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'companion' && styles.tabItemActive]}
          onPress={() => setActiveTab('companion')}
        >
          <Text style={styles.tabIcon}>🌱</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'companion' && styles.tabLabelActive,
            ]}
          >
            {t('nav.home', language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'care' && styles.tabItemActive]}
          onPress={() => setActiveTab('care')}
        >
          <Text style={styles.tabIcon}>🏥</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'care' && styles.tabLabelActive,
            ]}
          >
            {t('nav.care', language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'helplines' && styles.tabItemActive]}
          onPress={() => setActiveTab('helplines')}
        >
          <Text style={styles.tabIcon}>📞</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'helplines' && styles.tabLabelActive,
            ]}
          >
            {t('nav.helplines', language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'community' && styles.tabItemActive]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={styles.tabIcon}>🤝</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'community' && styles.tabLabelActive,
            ]}
          >
            {t('nav.community', language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            {t('nav.settings', language)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.deepOlive,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.deepOlive,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ivory,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#D8DECE',
    marginTop: 1,
  },
  emergencyPill: {
    backgroundColor: COLORS.coral,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  emergencyPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.sage,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.deepOlive,
    fontWeight: '700',
  },
});
