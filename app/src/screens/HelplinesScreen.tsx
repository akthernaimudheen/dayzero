import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { t, type SupportedLanguage } from '@dayzero/shared';
import { COLORS, SPACING } from '../theme';

interface HelplinesScreenProps {
  language: SupportedLanguage;
}

const VERIFIED_HELPLINES = [
  {
    number: '112',
    name: 'Kerala Emergency Response Support System (ERSS)',
    category: 'CRITICAL EMERGENCY',
    badgeColor: '#9E2A2B',
    bgColor: '#FCEDEC',
    hours: '24 Hours / 7 Days &bull; Toll-Free',
    languages: 'Malayalam, English, Tamil, Hindi',
    desc: 'For immediate life-threatening situations, physical injury, severe acute drug overdose, or violent distress. Connects directly to Police, Fire, and Ambulance.',
    source: 'Kerala SDMA & Kerala Police (https://sdma.kerala.gov.in/erss-112/)',
  },
  {
    number: '14416',
    altNumber: '1800-891-4416',
    name: 'Tele-MANAS Kerala (Mental Health Helpline)',
    category: 'CRISIS COUNSELLING',
    badgeColor: '#28633B',
    bgColor: '#EDF5EF',
    hours: '24 Hours / 7 Days &bull; Toll-Free',
    languages: 'Malayalam, English',
    desc: 'National Tele Mental Health Programme. Professional psychologists and counsellors offering confidential crisis intervention, de-addiction support, and suicidal distress care.',
    source: 'Ministry of Health & Family Welfare / Kerala Health Dept',
  },
  {
    number: '14446',
    name: 'Vimukthi Kerala De-addiction Helpline',
    category: 'SUBSTANCE RECOVERY',
    badgeColor: '#8C5438',
    bgColor: '#F8EFEA',
    hours: '24 Hours / 7 Days &bull; Toll-Free',
    languages: 'Malayalam',
    desc: 'Official Kerala Government anti-narcotics campaign mission helpline for guidance on admission to government de-addiction and counselling centres.',
    source: 'Excise Department, Government of Kerala',
  },
  {
    number: '14405',
    name: 'MANAS — National Narcotics Helpline (NCB)',
    category: 'NARCOTICS & LEGAL SUPPORT',
    badgeColor: '#4A5D52',
    bgColor: '#EDF1EE',
    hours: '24 Hours / 7 Days &bull; Toll-Free',
    languages: 'English, Hindi, Regional',
    desc: 'Narcotics Control Bureau toll-free national helpline for reporting drug trafficking, de-addiction consultation, and rehabilitation assistance.',
    source: 'Narcotics Control Bureau, Ministry of Home Affairs',
  },
  {
    number: '1056',
    name: 'DISHA Kerala Health Helpline',
    category: 'HEALTH & PSYCHOLOGICAL SUPPORT',
    badgeColor: '#4A5D52',
    bgColor: '#EDF1EE',
    hours: '24 Hours / 7 Days &bull; Toll-Free',
    languages: 'Malayalam, English',
    desc: 'State health department tele-advisory providing guidance on medical care, hospital beds, mental health assistance, and doctor consultations.',
    source: 'Department of Health & Family Welfare, Kerala',
  },
];

export const HelplinesScreen: React.FC<HelplinesScreenProps> = ({ language }) => {
  const handleCall = (number: string) => {
    const url = `tel:${number}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Phone Dialing', `Dial ${number} on your phone.`);
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('nav.helplines', language)}</Text>
      <Text style={styles.subtitle}>
        Verified, free, 24/7 government support lines in Kerala. Calls are initiated by you; no symptoms or personal details are sent through DayZero.
      </Text>

      {VERIFIED_HELPLINES.map((h, i) => (
        <View key={i} style={[styles.card, { backgroundColor: h.bgColor }]}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: h.badgeColor }]}>
              <Text style={styles.badgeText}>{h.category}</Text>
            </View>
            <Text style={styles.hoursText}>{h.hours}</Text>
          </View>

          <Text style={styles.name}>{h.name}</Text>
          <Text style={styles.desc}>{h.desc}</Text>
          <Text style={styles.meta}>Languages: {h.languages}</Text>

          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: h.badgeColor }]}
            onPress={() => handleCall(h.number)}
          >
            <Text style={styles.callBtnText}>Call {h.number}</Text>
          </TouchableOpacity>

          {h.altNumber ? (
            <TouchableOpacity
              style={styles.altCallBtn}
              onPress={() => handleCall(h.altNumber)}
            >
              <Text style={styles.altCallBtnText}>Or Call {h.altNumber}</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.sourceText}>Source: {h.source}</Text>
        </View>
      ))}
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
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  hoursText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  callBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  altCallBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  altCallBtnText: {
    color: COLORS.deepOlive,
    fontWeight: '600',
    fontSize: 12,
  },
  sourceText: {
    fontSize: 10,
    color: '#7D8880',
    marginTop: 4,
  },
});
