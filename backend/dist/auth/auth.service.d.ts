import { ConfigService } from "../core/config/config.service";
import { PrismaService } from "../prisma/prisma.service";
export declare class AuthService {
    private readonly config;
    private readonly prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    private readonly nonceStore;
    generateNonce(stakeAddress: string): string;
    verifyAndIssueToken(params: {
        stakeAddress: string;
        nonce: string;
        signature: string;
        key: string;
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
    } | {
        needProfile: true;
        roles: {
            id: number;
            code: string;
        }[];
    }>;
    createProfileAndIssueToken(params: {
        stakeAddress: string;
        roleCode: string;
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
}
