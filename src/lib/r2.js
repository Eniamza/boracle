// src/lib/r2.js - Cloudflare R2 Storage Utility
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_EXTENSIONS = ['pdf', 'pptx'];

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Build the R2 object key for a material file.
 * Pattern: courseCode/fileUuid.fileExtension
 */
export function buildObjectKey(courseCode, fileUuid, fileExtension) {
    return `${courseCode}/${fileUuid}.${fileExtension}`;
}

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(courseCode, fileUuid, fileExtension) {
    const key = buildObjectKey(courseCode, fileUuid, fileExtension);
    return `${PUBLIC_URL}/${key}`;
}

/**
 * Validate file extension against allowed list.
 */
export function isAllowedExtension(extension) {
    return ALLOWED_EXTENSIONS.includes(extension?.toLowerCase());
}

/**
 * Upload a file to R2.
 * @param {string} courseCode
 * @param {string} fileUuid
 * @param {string} fileExtension
 * @param {Buffer} buffer - File contents
 * @param {string} contentType - MIME type
 */
export async function uploadFile(courseCode, fileUuid, fileExtension, buffer, contentType) {
    const key = buildObjectKey(courseCode, fileUuid, fileExtension);

    await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));

    return getPublicUrl(courseCode, fileUuid, fileExtension);
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(courseCode, fileUuid, fileExtension) {
    const key = buildObjectKey(courseCode, fileUuid, fileExtension);

    await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    }));
}
