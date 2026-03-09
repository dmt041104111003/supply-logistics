import { ConfigService } from "../core/config/config.service";
import { ProfileRepositoryPort } from "./domain/profile.repository";
import { ListProfilesUseCase } from "./application/use-cases/list-profiles.use-case";
import { ListProfilesByRoleUseCase } from "./application/use-cases/list-profiles-by-role.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import { UploadProfileAvatarUseCase } from "./application/use-cases/upload-profile-avatar.use-case";
export declare class ProfileService {
    private readonly config;
    private readonly profileRepository;
    private readonly listProfilesUseCase;
    private readonly listProfilesByRoleUseCase;
    private readonly updateProfileUseCase;
    private readonly uploadProfileAvatarUseCase;
    constructor(config: ConfigService, profileRepository: ProfileRepositoryPort, listProfilesUseCase: ListProfilesUseCase, listProfilesByRoleUseCase: ListProfilesByRoleUseCase, updateProfileUseCase: UpdateProfileUseCase, uploadProfileAvatarUseCase: UploadProfileAvatarUseCase);
    listProfiles(): Promise<{
        walletAddress: string;
        displayName: string;
        location: string | null;
        coordinates: string | null;
        role: string | null;
    }[]>;
    listProfilesByRoleCode(roleCode: string): Promise<{
        id: number;
        displayName: string;
        walletAddress: string;
    }[]>;
    updateProfile(profileId: number, params: {
        displayName: string;
        location?: string;
        coordinates?: string;
    }): Promise<{
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
    uploadAvatar(profileId: number, imageDataUrl: string): Promise<{
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
