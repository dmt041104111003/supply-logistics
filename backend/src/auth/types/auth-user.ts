export type AuthUser = {
  sub: string;
  stakeAddress: string;
  profileId: number;
  role: string;
  displayName?: string;
  avatarUrl?: string | null;
  location?: string | null;
  coordinates?: string | null;
};

