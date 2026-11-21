'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { pb } from '../lib/pb';
import type { RecoveryGroup, GroupPost } from '@dayzero/shared';

export const CommunityView: React.FC = () => {
  const { account, isAuthenticated, t } = useApp();

  const [groups, setGroups] = useState<RecoveryGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RecoveryGroup | null>(null);
  const [members, setMembers] = useState<Array<{ membershipId: string; pseudonym: string; role: string; joinedAt: string }>>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [newPostBody, setNewPostBody] = useState('');
  const [loading, setLoading] = useState(false);

  // Invitation redemption
  const [inviteCode, setInviteCode] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  // Reporting
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const loadGroups = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const gList = await pb.getGroups();
      setGroups(gList);
      if (gList.length > 0 && !selectedGroup) {
        setSelectedGroup(gList[0]);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroupDetails = async (groupId: string) => {
    try {
      const [mList, pList] = await Promise.all([
        pb.getGroupMembers(groupId),
        pb.getGroupPosts(groupId),
      ]);
      setMembers(mList);
      setPosts(pList);
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  const handleRedeemInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError('');
    setRedeeming(true);
    try {
      await pb.redeemInvite(inviteCode.trim(), pseudonym.trim());
      setInviteCode('');
      setPseudonym('');
      await loadGroups();
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to redeem invitation code');
    } finally {
      setRedeeming(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newPostBody.trim()) return;
    try {
      await pb.createPost(selectedGroup.id, newPostBody.trim());
      setNewPostBody('');
      await loadGroupDetails(selectedGroup.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    }
  };

  const handleReportPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !reportingPostId || !reportReason.trim()) return;
    try {
      await pb.reportPost(selectedGroup.id, reportingPostId, reportReason.trim());
      alert('Report submitted for moderator review.');
      setReportingPostId(null);
      setReportReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  const handleModeratePost = async (postId: string, action: 'hide' | 'restore' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action} this post?`)) return;
    try {
      await pb.moderatePost(postId, action, 'Moderator action via web UI');
      if (selectedGroup) await loadGroupDetails(selectedGroup.id);
    } catch (err: any) {
      alert(err.message || 'Moderation action failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--deep-olive)', marginBottom: '0.5rem' }}>
            {t('community.title')}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Please sign in on the Companion tab to access your recovery circles.
          </p>
        </div>
      </div>
    );
  }

  // Current user's membership in selected group
  const myMembership = members.find((m) => m.role === 'moderator');
  const isModerator = account?.role === 'moderator' || account?.role === 'admin' || !!myMembership;

  return (
    <div style={{ maxWidth: '880px', margin: '1.5rem auto' }}>
      {/* Community Pilot Header & Ground Rules */}
      <div className="card" style={{ borderLeft: '4px solid var(--sage)' }}>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--deep-olive)', marginBottom: '0.35rem' }}>
          {t('community.title')} (Controlled Pilot)
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {t('community.subtitle')}
        </p>

        {/* Anonymity Notice */}
        <div style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.82rem', color: 'var(--deep-olive)' }}>
          <strong>🛡️ {t('community.pseudonymNotice')}</strong>
          <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>
            {t('community.anonymityNotice')}
          </div>
        </div>
      </div>

      {/* Invitation Redemption Box */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', color: 'var(--deep-olive)', marginBottom: '0.35rem' }}>
          {t('community.join')}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          Got an invitation code from a peer recovery facilitator? Enter it below with your pseudonym.
        </p>

        {redeemError && (
          <div style={{ backgroundColor: '#FBEBE6', color: '#9E2A2B', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            {redeemError}
          </div>
        )}

        <form onSubmit={handleRedeemInvite} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={t('community.joinCode')}
            style={{ flex: 1, minWidth: '180px', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
          />
          <input
            type="text"
            required
            minLength={2}
            maxLength={32}
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            placeholder={t('community.joinPseudonym')}
            style={{ width: '180px', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
          />
          <button type="submit" className="btn btn-primary" disabled={redeeming}>
            {redeeming ? 'Redeeming...' : 'Join Circle'}
          </button>
        </form>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          You are not currently a member of any recovery circle. Redeem an invitation code above to enter.
        </div>
      ) : (
        <div>
          {/* Active Circle Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g)}
                className={`btn ${selectedGroup?.id === g.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
              >
                👥 {g.name}
              </button>
            ))}
          </div>

          {selectedGroup && (
            <div>
              {/* Circle Roster Card (Pseudonyms Only) */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    Active Circle Members ({members.length})
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Rosters display pseudonyms only
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {members.map((m) => (
                    <span
                      key={m.membershipId}
                      className="badge"
                      style={{
                        backgroundColor: m.role === 'moderator' ? 'var(--pale-sage)' : 'var(--surface-raised)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--deep-olive)',
                      }}
                    >
                      {m.role === 'moderator' ? '⭐ ' : ''}
                      {m.pseudonym}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share a Reflection in Circle */}
              <div className="card">
                <form onSubmit={handleCreatePost}>
                  <textarea
                    rows={3}
                    required
                    maxLength={2000}
                    value={newPostBody}
                    onChange={(e) => setNewPostBody(e.target.value)}
                    placeholder={t('community.postPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      marginBottom: '0.65rem',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      What is shared in the circle stays in the circle.
                    </span>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                      {t('community.postSubmit')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Posts Feed */}
              {posts.map((post) => (
                <div key={post.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--deep-olive)' }}>
                      Circle Member ({post.author.slice(0, 6)})
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {post.created ? new Date(post.created).toLocaleDateString() : ''}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>
                    {post.body}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setReportingPostId(post.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      🚩 {t('community.report')}
                    </button>

                    {isModerator && (
                      <button
                        type="button"
                        onClick={() => handleModeratePost(post.id, 'hide')}
                        style={{ background: 'none', border: 'none', color: '#B26A00', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Hide (Mod)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      {reportingPostId && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Report Post</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Reports are reviewed by circle moderators.
            </p>
            <form onSubmit={handleReportPost}>
              <textarea
                required
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting (harassment, dangerous advice, substance offers)..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReportingPostId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
