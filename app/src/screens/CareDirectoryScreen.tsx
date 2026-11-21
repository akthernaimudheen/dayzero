import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  ALL_DISTRICTS,
  filterFacilities,
  toMalayalamScript,
  t,
  type SupportedLanguage,
  type Facility,
  type KeralaDistrict,
} from '@dayzero/shared';
import { api } from '../lib/api';
import { COLORS, SPACING } from '../theme';

interface CareDirectoryScreenProps {
  language: SupportedLanguage;
}

export const CareDirectoryScreen: React.FC<CareDirectoryScreenProps> = ({ language }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<KeralaDistrict | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    async function loadFacilities() {
      try {
        setLoading(true);
        const data = await api.fetchFacilities();
        setFacilities(data);
      } catch (err: any) {
        console.warn('Failed to load facilities', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFacilities();
  }, []);

  const filteredFacilities = filterFacilities(facilities, {
    query: searchQuery,
    district: selectedDistrict,
    facilityType: selectedType,
  });

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleaned}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Phone Dialing', `Dial number directly: ${cleaned}`);
      }
    });
  };

  const handleOpenDirections = (f: Facility) => {
    if (f.latitude && f.longitude) {
      const geoUrl = `geo:${f.latitude},${f.longitude}?q=${encodeURIComponent(f.name)}`;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;

      Linking.canOpenURL(geoUrl).then((supported) => {
        if (supported) {
          Linking.openURL(geoUrl);
        } else {
          Linking.openURL(mapsUrl);
        }
      });
    } else {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ', ' + f.district + ', Kerala')}`;
      Linking.openURL(mapsUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.title}>{t('care.title', language)}</Text>
        <Text style={styles.subtitle}>{t('care.subtitle', language)}</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search centre name, hospital, district..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* District Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.districtScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedDistrict === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedDistrict('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedDistrict === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Districts (14)
            </Text>
          </TouchableOpacity>

          {ALL_DISTRICTS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.filterPill,
                selectedDistrict === d && styles.filterPillActive,
              ]}
              onPress={() => setSelectedDistrict(d)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedDistrict === d && styles.filterPillTextActive,
                ]}
              >
                {language === 'ml' ? toMalayalamScript(d) : d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Facilities List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.sage} />
          <Text style={styles.loadingText}>Loading verified Kerala facilities...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.resultCount}>
            Showing {filteredFacilities.length} verified care facilities in Kerala
          </Text>

          {filteredFacilities.map((f) => (
            <View key={f.id} style={styles.facilityCard}>
              <View style={styles.badgeRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {f.facilityType === 'punarjani_homoeopathy'
                      ? 'Punarjani (Homeopathy)'
                      : f.facilityType === 'govt_deaddiction'
                      ? 'Govt. De-addiction'
                      : f.facilityType}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Verified Govt. Care</Text>
                </View>
              </View>

              <Text style={styles.facilityName}>{f.name}</Text>
              <Text style={styles.facilityAddress}>{f.address}</Text>

              {f.costNote ? (
                <Text style={styles.facilityNote}>
                  <Text style={styles.noteLabel}>Cost: </Text>
                  {f.costNote}
                </Text>
              ) : null}

              {f.hoursNote ? (
                <Text style={styles.facilityNote}>
                  <Text style={styles.noteLabel}>Hours: </Text>
                  {f.hoursNote}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {f.phone ? (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(f.phone)}
                  >
                    <Text style={styles.callBtnText}>Call: {f.phone}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => handleOpenDirections(f)}
                >
                  <Text style={styles.navBtnText}>Directions (OpenStreetMap / Maps)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sourceText}>
                Source: {f.sourceName} &bull; Verified: {f.verifiedAt || 'Official Record'}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.deepOlive,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  districtScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  filterPill: {
    backgroundColor: '#F3F5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  filterPillText: {
    fontSize: 12,
    color: COLORS.deepOlive,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resultCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    backgroundColor: COLORS.paleSage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.deepOlive,
  },
  verifiedBadge: {
    backgroundColor: '#EBF4EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#28633B',
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: 4,
  },
  facilityAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  facilityNote: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  noteLabel: {
    fontWeight: '600',
    color: COLORS.deepOlive,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: 8,
    flexWrap: 'wrap',
  },
  callBtn: {
    backgroundColor: COLORS.sage,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  navBtn: {
    backgroundColor: '#EBEFE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnText: {
    color: COLORS.deepOlive,
    fontSize: 12,
    fontWeight: '600',
  },
  sourceText: {
    fontSize: 10,
    color: '#8A978E',
    marginTop: 8,
  },
});
