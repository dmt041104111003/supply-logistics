import type { AuthUser } from "../auth/types/auth-user";
import { ProfileService } from "./profile.service";
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    listProfiles(_user: AuthUser): Promise<{
        walletAddress: string;
        displayName: string;
        location: string | null;
        coordinates: string | null;
        role: string | null;
    }[]>;
    listProfilesByRole(_user: AuthUser, role?: string): Promise<{
        id: number;
        displayName: string;
        walletAddress: string;
    }[]>;
    updateProfile(body: {
        displayName?: string;
        location?: string;
        coordinates?: string;
    }, user: AuthUser): Promise<{
        token: string;
        profile: {
            id: number;
            role: string;
            displayName: string;
            avatarUrl: string | null;
            location: string | null;
            coordinates: string | null;
        };
    }>;
    uploadAvatar(body: {
        imageDataUrl?: string;
    }, user: AuthUser): Promise<{
        token: string;
        profile: {
            id: number;
            role: string;
            displayName: string;
            avatarUrl: string | null;
            location: string | null;
            coordinates: string | null;
        };
    }>;
}
