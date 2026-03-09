import type { AuthUser } from "../auth/types/auth-user";
import { UploadService } from "./upload.service";
export declare class UploadController {
    private readonly upload;
    constructor(upload: UploadService);
    uploadImage(_user: AuthUser, body?: {
        imageDataUrl?: string;
        folder?: string;
    }): Promise<{
        url: string;
    }>;
}
