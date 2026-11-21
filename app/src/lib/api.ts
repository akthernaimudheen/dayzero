import type {
  Account,
  Checkin,
  Facility,
  Helpline,
  Post,
  RecoveryGroup,
} from '@dayzero/shared';

const DEFAULT_SERVER_URL = 'http://10.0.2.2:8090'; // Android emulator localhost alias or configurable
let currentToken: string | null = null;
let currentAccount: Account | null = null;
let serverBaseUrl = DEFAULT_SERVER_URL;

export function setServerBaseUrl(url: string) {
  serverBaseUrl = url.replace(/\/+$/, '');
}

export function getServerBaseUrl() {
  return serverBaseUrl;
}

export function getCurrentToken() {
  return currentToken;
}

export function getCurrentAccount(): Account | null {
  return currentAccount;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (currentToken) {
    headers['Authorization'] = currentToken;
  }

  const url = `${serverBaseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errData = await res.json();
      errMessage = errData.message || JSON.stringify(errData);
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export const api = {
  async register(data: { email: string; pass: string; language: string; timezone: string }): Promise<{ token: string; account: Account }> {
    await request('/api/collections/users/records', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.pass,
        passwordConfirm: data.pass,
        language: data.language || 'en',
        timezone: data.timezone || 'Asia/Kolkata',
      }),
    });

    return api.login(data.email, data.pass);
  },

  async login(identity: string, pass: string): Promise<{ token: string; account: Account }> {
    const res = await request<{ token: string; record: any }>('/api/collections/users/auth-with-password', {
      method: 'POST',
      body: JSON.stringify({
        identity,
        password: pass,
      }),
    });

    currentToken = res.token;
    currentAccount = {
      id: res.record.id,
      email: res.record.email,
      language: res.record.language || 'en',
      timezone: res.record.timezone || 'Asia/Kolkata',
      onboardedDate: res.record.onboardedDate || res.record.created.split('T')[0],
      createdAt: res.record.created,
    };

    return { token: res.token, account: currentAccount };
  },

  logout() {
    currentToken = null;
    currentAccount = null;
  },

  async deleteAccount(password: string): Promise<void> {
    await request('/api/dayzero/account/delete', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    api.logout();
  },

  async fetchCheckins(): Promise<Checkin[]> {
    if (!currentToken) return [];
    const res = await request<{ items: any[] }>('/api/collections/checkins/records?sort=-created&limit=30');
    return res.items.map((r) => ({
      id: r.id,
      user: r.user,
      localDate: r.localDate,
      mood: r.mood,
      note: r.note,
      completed: r.completed,
      recordedAt: r.created,
    }));
  },

  async recordCheckin(data: { mood: number; note?: string; completed?: boolean }): Promise<Checkin> {
    const res = await request<any>('/api/collections/checkins/records', {
      method: 'POST',
      body: JSON.stringify({
        mood: data.mood,
        note: data.note || '',
        completed: data.completed ?? true,
      }),
    });

    return {
      id: res.id,
      user: res.user,
      localDate: res.localDate,
      mood: res.mood,
      note: res.note,
      completed: res.completed,
      recordedAt: res.created,
    };
  },

  async fetchGoals(): Promise<{ id: string; title: string; active: boolean }[]> {
    if (!currentToken) return [];
    const res = await request<{ items: any[] }>('/api/collections/goals/records?sort=-created&limit=10');
    return res.items.map((r) => ({
      id: r.id,
      title: r.title,
      active: r.active,
    }));
  },

  async createGoal(title: string): Promise<{ id: string; title: string; active: boolean }> {
    const res = await request<any>('/api/collections/goals/records', {
      method: 'POST',
      body: JSON.stringify({
        title,
        active: true,
      }),
    });
    return {
      id: res.id,
      title: res.title,
      active: res.active,
    };
  },

  async fetchFacilities(): Promise<Facility[]> {
    const res = await request<{ items: any[] }>('/api/collections/facilities/records?limit=200');
    return res.items.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      district: r.district,
      facilityType: r.facilityType,
      services: typeof r.services === 'string' ? JSON.parse(r.services) : (r.services || []),
      phone: r.phone,
      costNote: r.costNote,
      eligibilityNote: r.eligibilityNote,
      hoursNote: r.hoursNote,
      sourceName: r.sourceName,
      sourceUrl: r.sourceUrl,
      sourceRetrievedAt: r.sourceRetrievedAt,
      verifiedAt: r.verifiedAt,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  },

  async fetchHelplines(): Promise<Helpline[]> {
    const res = await request<{ items: any[] }>('/api/collections/helplines/records?limit=50&sort=priority');
    return res.items.map((r) => ({
      id: r.id,
      name: r.name,
      phoneNumber: r.phoneNumber,
      category: r.category,
      operatingHours: r.operatingHours,
      languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : (r.languages || []),
      priority: r.priority,
      cost: r.cost,
      description: r.description,
      verifiedAt: r.verifiedAt,
    }));
  },

  async fetchGroups(): Promise<RecoveryGroup[]> {
    if (!currentToken) return [];
    const res = await request<{ items: any[] }>('/api/collections/groups/records?limit=50');
    return res.items.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      communityRules: r.communityRules,
      inviteOnly: r.inviteOnly,
      status: r.status,
    }));
  },

  async redeemInvitation(code: string, pseudonym: string): Promise<any> {
    return request('/api/dayzero/community/join', {
      method: 'POST',
      body: JSON.stringify({ code, pseudonym }),
    });
  },

  async fetchPosts(groupId: string): Promise<Post[]> {
    const res = await request<{ items: any[] }>(`/api/collections/posts/records?filter=(group='${groupId}')&sort=-created&limit=50`);
    return res.items.map((r) => ({
      id: r.id,
      group: r.group,
      authorPseudonym: r.authorPseudonym,
      content: r.content,
      isPinned: r.isPinned,
      created: r.created,
    }));
  },

  async createPost(groupId: string, content: string): Promise<Post> {
    const res = await request<any>('/api/collections/posts/records', {
      method: 'POST',
      body: JSON.stringify({
        group: groupId,
        content,
      }),
    });
    return {
      id: res.id,
      group: res.group,
      authorPseudonym: res.authorPseudonym,
      content: res.content,
      isPinned: res.isPinned,
      created: res.created,
    };
  },

  async reportPost(postId: string, reason: string): Promise<any> {
    return request('/api/collections/reports/records', {
      method: 'POST',
      body: JSON.stringify({
        post: postId,
        reason,
      }),
    });
  },
};
