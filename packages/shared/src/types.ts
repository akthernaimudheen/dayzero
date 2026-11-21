// DayZero Shared Types

export type SupportedLanguage = 'en' | 'ml' | 'ml-Latn';

export type UserRole = 'member' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface Account {
  id: string;
  email?: string;
  language: SupportedLanguage;
  timezone: string;
  onboardedAt?: string | null;
  role: UserRole;
  status: AccountStatus;
  created?: string;
  updated?: string;
}

export type KeralaDistrict =
  | 'Thiruvananthapuram'
  | 'Kollam'
  | 'Pathanamthitta'
  | 'Alappuzha'
  | 'Kottayam'
  | 'Idukki'
  | 'Ernakulam'
  | 'Thrissur'
  | 'Palakkad'
  | 'Malappuram'
  | 'Kozhikode'
  | 'Wayanad'
  | 'Kannur'
  | 'Kasaragod';

export type FacilityType =
  | 'govt_deaddiction'
  | 'punarjani_homoeopathy'
  | 'mental_health'
  | 'irca'
  | 'hospital_atf'
  | 'other';

export type VerificationStatus = 'verified' | 'unverified' | 'stale';

export interface Facility {
  id: string;
  name: string;
  address: string;
  district: KeralaDistrict;
  facilityType: FacilityType;
  services: string[];
  phone?: string;
  costNote?: string;
  eligibilityNote?: string;
  hoursNote?: string;
  sourceName: string;
  sourceUrl: string;
  sourceRetrievedAt: string;
  verifiedAt: string;
  verificationStatus: VerificationStatus;
  lat?: number | null;
  lng?: number | null;
  distanceKm?: number;
}

export type HelplineCategory = 'emergency' | 'crisis' | 'counselling' | 'referral';

export interface Helpline {
  id: string;
  name: string;
  number: string;
  category: HelplineCategory;
  descriptionEn: string;
  descriptionMl?: string;
  issuer: string;
  sourceUrl: string;
  verifiedAt: string;
  status: VerificationStatus;
}

export interface Checkin {
  id?: string;
  user?: string;
  localDate: string; // YYYY-MM-DD
  mood: number; // 1 to 5
  note?: string;
  completed: boolean;
  recordedAt: string;
}

export interface Goal {
  id?: string;
  user?: string;
  title: string;
  active: boolean;
  createdAt?: string;
}

export interface DayStatus {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Sun, Mon, etc.
  isEligible: boolean;
  isCompleted: boolean;
  mood?: number;
  noteSnippet?: string;
}

export interface WeeklyConsistencyMetric {
  windowStart: string; // YYYY-MM-DD
  windowEnd: string; // YYYY-MM-DD (reference date)
  totalDaysInWindow: number; // always 7
  eligibleDaysCount: number;
  completedDaysCount: number;
  consistencyPercentage: number; // 0 to 100
  days: DayStatus[];
  streakDays: number;
  supportiveMessageKey: string;
}

export interface RecoveryGroup {
  id: string;
  name: string;
  description?: string;
  communityRules: string;
  inviteOnly: boolean;
  status: 'active' | 'archived';
  createdBy?: string;
}

export interface GroupMembership {
  id: string;
  group: string;
  user: string;
  pseudonym: string;
  role: 'member' | 'moderator';
  status: 'active' | 'removed' | 'banned';
  joinedAt: string;
  addedBy?: string;
}

export interface GroupPost {
  id: string;
  group: string;
  author: string;
  authorPseudonym?: string;
  body: string;
  status: 'visible' | 'hidden';
  hiddenReason?: string;
  created?: string;
  updated?: string;
}

export interface GroupInvitation {
  id: string;
  group: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  revokedAt?: string | null;
  maxUses: number;
  usedCount: number;
}
