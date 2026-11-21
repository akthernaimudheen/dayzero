// PocketBase API Client for DayZero Web

import type {
  Account,
  Checkin,
  Facility,
  Helpline,
  RecoveryGroup,
  GroupMembership,
  GroupPost,
  Goal,
} from '@dayzero/shared';

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';

class PocketBaseClient {
  private token: string | null = null;
  private currentAccount: Account | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('dayzero_auth_token');
      const savedUser = localStorage.getItem('dayzero_auth_user');
      if (savedUser) {
        try {
          this.currentAccount = JSON.parse(savedUser);
        } catch {
          // ignore invalid cache
        }
      }
    }
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  public getCurrentAccount(): Account | null {
    return this.currentAccount;
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.currentAccount;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = this.token;
    }

    const res = await fetch(`${PB_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || `Request failed with status ${res.status}`;
      throw new Error(msg);
    }

    return data as T;
  }

  // ------------------------------------------------------------- Auth
  public async register(payload: {
    email: string;
    password: string;
    language: string;
    timezone: string;
  }): Promise<{ account: Account; token: string }> {
    await this.request('/api/collections/accounts/records', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        passwordConfirm: payload.password,
      }),
    });

    return this.login(payload.email, payload.password);
  }

  public async login(
    identity: string,
    password: string
  ): Promise<{ account: Account; token: string }> {
    const res = await this.request<{ token: string; record: Account }>(
      '/api/collections/accounts/auth-with-password',
      {
        method: 'POST',
        body: JSON.stringify({ identity, password }),
      }
    );

    this.token = res.token;
    this.currentAccount = res.record;

    if (typeof window !== 'undefined') {
      localStorage.setItem('dayzero_auth_token', res.token);
      localStorage.setItem('dayzero_auth_user', JSON.stringify(res.record));
    }

    return { account: res.record, token: res.token };
  }

  public logout(): void {
    this.token = null;
    this.currentAccount = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dayzero_auth_token');
      localStorage.removeItem('dayzero_auth_user');
    }
  }

  public async deleteAccount(password: string): Promise<void> {
    await this.request('/api/dayzero/account/delete', {
      method: 'POST',
      body: JSON.stringify({ confirm: 'DELETE', password }),
    });
    this.logout();
  }

  // ------------------------------------------------------------- Public Care
  public async getFacilities(): Promise<Facility[]> {
    const res = await this.request<{ items: Facility[] }>(
      '/api/collections/facilities/records?perPage=100&sort=name'
    );
    return res.items || [];
  }

  public async getHelplines(): Promise<Helpline[]> {
    const res = await this.request<{ items: Helpline[] }>(
      '/api/collections/helplines/records?perPage=50&sort=category'
    );
    return res.items || [];
  }

  // ------------------------------------------------------------- Check-ins
  public async getCheckins(): Promise<Checkin[]> {
    if (!this.isAuthenticated()) return [];
    const res = await this.request<{ items: Checkin[] }>(
      '/api/collections/checkins/records?sort=-localDate&perPage=50'
    );
    return res.items || [];
  }

  public async createCheckin(payload: {
    localDate: string;
    mood: number;
    note?: string;
    completed: boolean;
  }): Promise<Checkin> {
    if (!this.currentAccount) throw new Error('Authentication required');

    return this.request<Checkin>('/api/collections/checkins/records', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        user: this.currentAccount.id,
        recordedAt: new Date().toISOString(),
      }),
    });
  }

  // ------------------------------------------------------------- Goals
  public async getGoals(): Promise<Goal[]> {
    if (!this.isAuthenticated()) return [];
    const res = await this.request<{ items: Goal[] }>(
      '/api/collections/goals/records?sort=-createdAt&perPage=20'
    );
    return res.items || [];
  }

  public async createGoal(title: string): Promise<Goal> {
    if (!this.currentAccount) throw new Error('Authentication required');
    return this.request<Goal>('/api/collections/goals/records', {
      method: 'POST',
      body: JSON.stringify({
        user: this.currentAccount.id,
        title,
        active: true,
        createdAt: new Date().toISOString(),
      }),
    });
  }

  // ------------------------------------------------------------- Community
  public async getGroups(): Promise<RecoveryGroup[]> {
    if (!this.isAuthenticated()) return [];
    const res = await this.request<{ items: RecoveryGroup[] }>(
      '/api/collections/groups/records?sort=-created'
    );
    return res.items || [];
  }

  public async redeemInvite(code: string, pseudonym: string): Promise<{ group: string }> {
    return this.request<{ group: string }>('/api/dayzero/community/join', {
      method: 'POST',
      body: JSON.stringify({ code, pseudonym }),
    });
  }

  public async getGroupMembers(
    groupId: string
  ): Promise<Array<{ membershipId: string; pseudonym: string; role: string; joinedAt: string }>> {
    return this.request<Array<{ membershipId: string; pseudonym: string; role: string; joinedAt: string }>>(
      `/api/dayzero/groups/${groupId}/members`
    );
  }

  public async getGroupPosts(groupId: string): Promise<GroupPost[]> {
    const res = await this.request<{ items: GroupPost[] }>(
      `/api/collections/posts/records?filter=${encodeURIComponent(`group = "${groupId}" && status = "visible"`)}&sort=-created&perPage=50`
    );
    return res.items || [];
  }

  public async createPost(groupId: string, body: string): Promise<GroupPost> {
    if (!this.currentAccount) throw new Error('Authentication required');
    return this.request<GroupPost>('/api/collections/posts/records', {
      method: 'POST',
      body: JSON.stringify({
        group: groupId,
        author: this.currentAccount.id,
        body,
        status: 'visible',
      }),
    });
  }

  public async reportPost(groupId: string, postId: string, reason: string): Promise<void> {
    if (!this.currentAccount) throw new Error('Authentication required');
    await this.request('/api/collections/reports/records', {
      method: 'POST',
      body: JSON.stringify({
        group: groupId,
        reporter: this.currentAccount.id,
        targetPost: postId,
        reason,
        status: 'open',
      }),
    });
  }

  public async moderatePost(
    postId: string,
    action: 'hide' | 'restore' | 'delete',
    reason: string
  ): Promise<void> {
    await this.request(`/api/dayzero/moderation/posts/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }
}

export const pb = new PocketBaseClient();
