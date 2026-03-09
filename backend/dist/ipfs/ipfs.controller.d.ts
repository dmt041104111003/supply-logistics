import type { AuthUser } from "../auth/types/auth-user";
import { IpfsService } from "./ipfs.service";
export declare class IpfsController {
    private readonly ipfs;
    constructor(ipfs: IpfsService);
    upload(file: {
        buffer: Buffer;
        originalname?: string;
        mimetype?: string;
    } | undefined, _user: AuthUser): Promise<{
        ipfsHash: string;
    }>;
    getGatewayUrl(hash: string): {
        url: string;
    };
}
