import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.STORAGE_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
        secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
    },
    ...(process.env.STORAGE_ENDPOINT && {
        endpoint: process.env.STORAGE_ENDPOINT,
    }),
});

const BUCKET = process.env.STORAGE_BUCKET || "";

export interface UploadFileOptions {
    file: Buffer;
    key: string;
    contentType: string;
    metadata?: Record<string, string>;
}

export async function uploadFile(options: UploadFileOptions) {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: options.key,
            Body: options.file,
            ContentType: options.contentType,
            Metadata: options.metadata,
        });

        await s3Client.send(command);

        return {
            success: true,
            key: options.key,
            url: `https://${BUCKET}.s3.${process.env.STORAGE_REGION}.amazonaws.com/${options.key}`,
        };
    } catch (error) {
        console.error("S3 upload error:", error);
        return { success: false, error: "Failed to upload file" };
    }
}

export async function deleteFile(key: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });

        await s3Client.send(command);
        return { success: true };
    } catch (error) {
        console.error("S3 delete error:", error);
        return { success: false, error: "Failed to delete file" };
    }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return { success: true, url };
    } catch (error) {
        console.error("S3 signed URL error:", error);
        return { success: false, error: "Failed to generate download URL" };
    }
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresIn: number = 300) {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: contentType,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return { success: true, url, key };
    } catch (error) {
        console.error("S3 signed upload URL error:", error);
        return { success: false, error: "Failed to generate upload URL" };
    }
}

export function generateFileKey(userId: string, folder: string, filename: string): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${folder}/${userId}/${timestamp}-${sanitized}`;
}
