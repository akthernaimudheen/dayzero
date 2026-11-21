import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  calculateWeeklyConsistency,
  getLocalDateString,
  t,
  type SupportedLanguage,
  type Checkin,
  type WeeklyConsistencyMetric,
} from '@dayzero/shared';
import { api, getCurrentAccount } from '../lib/api';
import { COLORS, SPACING } from '../theme';

interface CompanionScreenProps {
  language: SupportedLanguage;
  onNavigateTab: (tab: string) => void;
  onOpenEmergency: () => void;
}

const MOODS = [
  { val: 1, label: '1', desc: 'Distressed' },
  { val: 2, label: '2', desc: 'Struggling' },
  { val: 3, label: '3', desc: 'Steady' },
  { val: 4, label: '4', desc: 'Hopeful' },
  { val: 5, label: '5', desc: 'Strong' },
];

export const CompanionScreen: React.FC<CompanionScreenProps> = ({
  language,
  onNavigateTab,
  onOpenEmergency,
}) => {
  const account = getCurrentAccount();
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [reflectionNote, setReflectionNote] = useState<string>('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [metric, setMetric] = useState<WeeklyConsistencyMetric | null>(null);
  const [goals, setGoals] = useState<{ id: string; title: string; active: boolean }[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Authentication inline state for demo/guest
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPass, setAuthPass] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const loadData = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const [fetchedCheckins, fetchedGoals] = await Promise.all([
        api.fetchCheckins(),
        api.fetchGoals(),
      ]);
      setCheckins(fetchedCheckins);
      setGoals(fetchedGoals);

      const todayStr = getLocalDateString(new Date(), account.timezone || 'Asia/Kolkata');
      const m = calculateWeeklyConsistency({
        checkins: fetchedCheckins,
        referenceDate: todayStr,
        onboardedDate: account.onboardedDate,
      });
      setMetric(m);
    } catch (e: any) {
      console.warn('Failed to load checkins', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [account]);

  const handleRecordCheckin = async () => {
    if (!account) return;
    try {
      setLoading(true);
      await api.recordCheckin({
        mood: selectedMood,
        note: reflectionNote.trim(),
        completed: true,
      });
      setReflectionNote('');
      setMessage(t('checkin.done', language));
      await loadData();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !account) return;
    try {
      await api.createGoal(newGoalTitle.trim());
      setNewGoalTitle('');
      await loadData();
    } catch (e: any) {
      console.warn('Failed to add goal', e.message);
    }
  };

  const handleQuickLogin = async () => {
    if (!authEmail.trim() || !authPass.trim()) return;
    try {
      setAuthLoading(true);
      await api.login(authEmail.trim(), authPass.trim());
      await loadData();
    } catch (e: any) {
      // If login fails, try registering as new account
      try {
        await api.register({
          email: authEmail.trim(),
          pass: authPass.trim(),
          language,
          timezone: 'Asia/Kolkata',
        });
        await loadData();
      } catch (regErr: any) {
        setMessage(`Sign-in error: ${e.message}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner Notice */}
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>
          {t('emergency.title', language)}
        </Text>
        <Text style={styles.emergencyText}>
          {t('emergency.description', language)}
        </Text>
        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={onOpenEmergency}
          accessibilityLabel="Open Emergency Guidelines"
        >
          <Text style={styles.emergencyBtnText}>
            {t('emergency.call112', language)}
          </Text>
        </TouchableOpacity>
      </View>

      {!account ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app.name', language)} — Private Companion</Text>
          <Text style={styles.cardSubtitle}>
            Your check-in reflections and recovery consistency are stored privately on your self-hosted instance. No phone numbers or legal names required.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Pseudonym or Private Email"
            placeholderTextColor="#888"
            value={authEmail}
            onChangeText={setAuthEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (minimum 8 characters)"
            placeholderTextColor="#888"
            value={authPass}
            onChangeText={setAuthPass}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleQuickLogin}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In / Register Privately</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Consistency Widget */}
          {metric && (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{t('consistency.title', language)}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {metric.consistencyPercentage}% Consistent
                  </Text>
                </View>
              </View>

              <Text style={styles.cardSubtitle}>
                {t(metric.supportiveMessageKey, language)}
              </Text>

              {/* 7-Day Visual Tracker */}
              <View style={styles.daysRow}>
                {metric.days.map((d, idx) => (
                  <View key={idx} style={styles.dayCol}>
                    <Text style={styles.dayLabel}>{d.dayOfWeek}</Text>
                    <View
                      style={[
                        styles.dayCircle,
                        d.isCompleted && styles.dayCircleCompleted,
                        !d.isEligible && styles.dayCircleIneligible,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCircleText,
                          d.isCompleted && styles.dayCircleTextCompleted,
                        ]}
                      >
                        {d.isCompleted ? '✓' : '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={styles.caption}>
                {metric.completedDaysCount} of {metric.eligibleDaysCount} eligible days completed in 7-day rolling window. Streak: {metric.streakDays} days.
              </Text>
            </View>
          )}

          {/* Daily Check-in Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('checkin.title', language)}</Text>
            <Text style={styles.cardSubtitle}>
              {t('checkin.subtitle', language)}
            </Text>

            <Text style={styles.fieldLabel}>{t('checkin.mood', language)}</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.val}
                  style={[
                    styles.moodBtn,
                    selectedMood === m.val && styles.moodBtnSelected,
                  ]}
                  onPress={() => setSelectedMood(m.val)}
                >
                  <Text
                    style={[
                      styles.moodBtnText,
                      selectedMood === m.val && styles.moodBtnTextSelected,
                    ]}
                  >
                    {m.val}
                  </Text>
                  <Text style={styles.moodDesc}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('checkin.note', language)}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('checkin.note.placeholder', language)}
              placeholderTextColor="#888"
              value={reflectionNote}
              onChangeText={setReflectionNote}
              multiline
              numberOfLines={3}
            />

            {message ? <Text style={styles.messageText}>{message}</Text> : null}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRecordCheckin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {t('checkin.submit', language)}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Personal Goals Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Intentions</Text>
            <View style={styles.goalInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="New intention (e.g. 15 min walk, breathing)..."
                placeholderTextColor="#888"
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
              />
              <TouchableOpacity style={styles.smallBtn} onPress={handleAddGoal}>
                <Text style={styles.smallBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {goals.map((g) => (
              <View key={g.id} style={styles.goalItem}>
                <Text style={styles.goalDot}>&bull;</Text>
                <Text style={styles.goalText}>{g.title}</Text>
              </View>
            ))}
          </View>
        </>
      )}
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
  emergencyCard: {
    backgroundColor: COLORS.emergencyBg,
    borderColor: COLORS.emergencyBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9E2A2B',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 13,
    color: '#491213',
    lineHeight: 18,
    marginBottom: 8,
  },
  emergencyBtn: {
    backgroundColor: COLORS.coral,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.deepOlive,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: COLORS.paleSage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.deepOlive,
    fontWeight: '700',
    fontSize: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  dayCol: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCircleCompleted: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  dayCircleIneligible: {
    opacity: 0.4,
  },
  dayCircleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dayCircleTextCompleted: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  caption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.deepOlive,
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  moodBtn: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 10,
    backgroundColor: '#F3F5EE',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodBtnSelected: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  moodBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepOlive,
  },
  moodBtnTextSelected: {
    color: '#FFFFFF',
  },
  moodDesc: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: COLORS.sage,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.sage,
    marginBottom: 8,
    fontWeight: '600',
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  smallBtn: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  goalDot: {
    fontSize: 16,
    color: COLORS.sage,
    marginRight: 6,
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
