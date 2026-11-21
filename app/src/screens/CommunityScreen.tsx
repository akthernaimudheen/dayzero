import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { t, type SupportedLanguage, type Post, type RecoveryGroup } from '@dayzero/shared';
import { api, getCurrentAccount } from '../lib/api';
import { COLORS, SPACING } from '../theme';

interface CommunityScreenProps {
  language: SupportedLanguage;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ language }) => {
  const account = getCurrentAccount();
  const [groups, setGroups] = useState<RecoveryGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RecoveryGroup | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [pseudonym, setPseudonym] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [rulesAccepted, setRulesAccepted] = useState<boolean>(false);

  const loadGroups = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const gList = await api.fetchGroups();
      setGroups(gList);
      if (gList.length > 0 && !selectedGroup) {
        setSelectedGroup(gList[0]);
        loadPosts(gList[0].id);
      }
    } catch (e: any) {
      console.warn('Failed to load groups', e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (groupId: string) => {
    try {
      const pList = await api.fetchPosts(groupId);
      setPosts(pList);
    } catch (e: any) {
      console.warn('Failed to load posts', e.message);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [account]);

  const handleRedeemInvite = async () => {
    if (!inviteCode.trim() || !pseudonym.trim()) {
      Alert.alert('Required Fields', 'Please enter both an invitation code and a pseudonym.');
      return;
    }
    if (!rulesAccepted) {
      Alert.alert('Community Rules', 'You must review and accept the community guidelines.');
      return;
    }
    try {
      setLoading(true);
      await api.redeemInvitation(inviteCode.trim(), pseudonym.trim());
      Alert.alert('Joined Circle', `Welcome to the recovery circle as ${pseudonym}!`);
      setInviteCode('');
      setPseudonym('');
      await loadGroups();
    } catch (e: any) {
      Alert.alert('Join Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedGroup) return;
    try {
      setLoading(true);
      await api.createPost(selectedGroup.id, newPostContent.trim());
      setNewPostContent('');
      await loadPosts(selectedGroup.id);
    } catch (e: any) {
      Alert.alert('Post Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportPost = async (postId: string) => {
    Alert.prompt
      ? Alert.prompt('Report Post', 'Enter reason for reporting to circle moderators:', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Report',
            onPress: async (reason) => {
              try {
                await api.reportPost(postId, reason || 'Inappropriate content');
                Alert.alert('Reported', 'Post reported for moderator review.');
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ])
      : Alert.alert('Report Post', 'Report this post for moderator review?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report',
            onPress: async () => {
              try {
                await api.reportPost(postId, 'Inappropriate content');
                Alert.alert('Reported', 'Post reported for moderator review.');
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ]);
  };

  if (!account) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Private Moderated Circles</Text>
        <Text style={styles.subtitleCenter}>
          Please sign in or register with a pseudonym on the Companion tab to participate in invitation-based recovery groups.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Privacy Notice */}
      <View style={styles.privacyBanner}>
        <Text style={styles.bannerTitle}>Privacy & Safety in Circles</Text>
        <Text style={styles.bannerText}>
          Circles are invitation-only and moderated. Your email and identity are never shown to other members—only your chosen pseudonym. Remember: pseudonyms do not guarantee complete anonymity. Never share phone numbers, addresses, or illegal material.
        </Text>
      </View>

      {/* Invitation Redemption Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join a Recovery Circle</Text>
        <Text style={styles.cardSubtitle}>
          Enter an invitation code provided by your peer facilitator or group moderator.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Invitation Code (e.g. KOCHI-2026-X7)"
          placeholderTextColor="#888"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />

        <TextInput
          style={styles.input}
          placeholder="Your Pseudonym (e.g. RiverGuide, HopeSeeker)"
          placeholderTextColor="#888"
          value={pseudonym}
          onChangeText={setPseudonym}
        />

        <TouchableOpacity
          style={styles.rulesRow}
          onPress={() => setRulesAccepted(!rulesAccepted)}
        >
          <View style={[styles.checkbox, rulesAccepted && styles.checkboxChecked]}>
            {rulesAccepted && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.rulesText}>
            I agree to the Community Rules: respect privacy, no shame, no substance promotion, supportive peer listening only.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, !rulesAccepted && styles.primaryBtnDisabled]}
          onPress={handleRedeemInvite}
          disabled={loading || !rulesAccepted}
        >
          <Text style={styles.primaryBtnText}>Redeem Code & Join</Text>
        </TouchableOpacity>
      </View>

      {/* Active Groups & Feed */}
      {groups.length > 0 && selectedGroup && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedGroup.name}</Text>
          <Text style={styles.cardSubtitle}>{selectedGroup.description || 'Private peer circle'}</Text>

          {/* New Post Input */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share a reflection, challenge, or encouragement with the circle..."
            placeholderTextColor="#888"
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleCreatePost}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>Post Reflection</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Posts List */}
          <Text style={styles.feedHeader}>Recent Group Reflections ({posts.length})</Text>

          {posts.map((p) => (
            <View key={p.id} style={styles.postItem}>
              <View style={styles.postMetaRow}>
                <Text style={styles.postAuthor}>{p.authorPseudonym}</Text>
                <TouchableOpacity onPress={() => handleReportPost(p.id)}>
                  <Text style={styles.reportText}>Report</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.postContent}>{p.content}</Text>
              <Text style={styles.postTime}>
                {new Date(p.created).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: 8,
  },
  subtitleCenter: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  privacyBanner: {
    backgroundColor: COLORS.paleSage,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#C8D6C3',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
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
    fontSize: 17,
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
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.sage,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.sage,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rulesText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.sage,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  feedHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.deepOlive,
    marginBottom: SPACING.sm,
  },
  postItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2EB',
  },
  postMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  postAuthor: {
    fontWeight: '700',
    fontSize: 13,
    color: COLORS.deepOlive,
  },
  reportText: {
    fontSize: 11,
    color: COLORS.terracotta,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  postTime: {
    fontSize: 11,
    color: '#999',
  },
});
