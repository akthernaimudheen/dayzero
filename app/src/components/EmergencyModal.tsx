import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { EMERGENCY_GUIDANCE, CLINICAL_SAFETY_DISCLAIMER } from '@dayzero/shared';
import { COLORS, SPACING } from '../theme';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ visible, onClose }) => {
  const handleCall = (number: string) => {
    const url = `tel:${number}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Phone Dialing', `Dial ${number} directly.`);
      }
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>CRITICAL EMERGENCY GUIDANCE</Text>
              </View>
              <Text style={styles.title}>Immediate Medical / Crisis Action</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close emergency guidance"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            {/* Quick Call Row */}
            <View style={styles.callRow}>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: '#9E2A2B' }]}
                onPress={() => handleCall('112')}
              >
                <Text style={styles.callBtnNum}>112</Text>
                <Text style={styles.callBtnLabel}>Emergency Rescue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: '#28633B' }]}
                onPress={() => handleCall('14416')}
              >
                <Text style={styles.callBtnNum}>14416</Text>
                <Text style={styles.callBtnLabel}>Tele-MANAS Crisis</Text>
              </TouchableOpacity>
            </View>

            {/* Severe Alcohol Withdrawal Warning */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.title}
              </Text>
              <Text style={styles.warningBox}>
                ⚠️ {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.contraindications[0]}
              </Text>
              <Text style={styles.subhead}>Dangerous Symptoms:</Text>
              {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.symptoms.map((s, i) => (
                <Text key={i} style={styles.bulletItem}>
                  &bull; {s}
                </Text>
              ))}
              <Text style={styles.actionText}>
                <strong>Action: </strong>
                {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.immediateAction}
              </Text>
            </View>

            {/* Overdose Action */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {EMERGENCY_GUIDANCE.suspected_overdose.title}
              </Text>
              <Text style={styles.subhead}>Overdose Signs:</Text>
              {EMERGENCY_GUIDANCE.suspected_overdose.symptoms.map((s, i) => (
                <Text key={i} style={styles.bulletItem}>
                  &bull; {s}
                </Text>
              ))}
              <Text style={styles.actionText}>
                {EMERGENCY_GUIDANCE.suspected_overdose.immediateAction}
              </Text>
            </View>

            {/* Clinical Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>{CLINICAL_SAFETY_DISCLAIMER}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close Guidance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 61, 48, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: '#FCECEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#9E2A2B',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.deepOlive,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  scrollArea: {
    marginBottom: SPACING.md,
  },
  callRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.md,
  },
  callBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callBtnNum: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  callBtnLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FAF9F5',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: '#FFF2F0',
    borderColor: '#E8A393',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: '#7D2223',
    lineHeight: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  subhead: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.deepOlive,
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 17,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.deepOlive,
    marginTop: 8,
    lineHeight: 17,
    fontWeight: '500',
  },
  disclaimerBox: {
    padding: 8,
    backgroundColor: '#EDF1EE',
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#4A5D52',
    lineHeight: 15,
  },
  doneBtn: {
    backgroundColor: COLORS.sage,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
