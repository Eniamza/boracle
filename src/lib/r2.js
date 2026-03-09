// src/lib/r2.js - Cloudflare R2 Storage Utility
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_EXTENSIONS = ['pdf', 'pptx', 'doc', 'docx'];

// R2_ENDPOINT may include a trailing path segment (e.g. /boracle) from the
// API-token scope.  Strip it — the SDK needs just the origin.
const r2Origin = process.env.R2_ENDPOINT.replace(/\/[^/]+$/, '');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: r2Origin,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
const PATH_PREFIX = process.env.R2_PATH_PREFIX || '';

/**
 * Build the R2 object key for a material file.
 * Pattern: {prefix}/courseCode/fileUuid.fileExtension
 */
export function buildObjectKey(courseCode, fileUuid, fileExtension) {
    const base = `${courseCode}/${fileUuid}.${fileExtension}`;
    return PATH_PREFIX ? `${PATH_PREFIX}/${base}` : base;
}

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(courseCode, fileUuid, fileExtension) {
    const key = buildObjectKey(courseCode, fileUuid, fileExtension);
    // Ensure protocol is present so browsers don't treat it as a relative URL
    const base = PUBLIC_URL.startsWith('http') ? PUBLIC_URL : `https://${PUBLIC_URL}`;
    return `${base}/${BUCKET_NAME}/${key}`;
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

/**
 * Build the Worker upload URL so the client can PUT directly to the
 * Cloudflare Worker, which streams the file into R2.
 *
 * @param {string} courseCode
 * @param {string} fileUuid
 * @param {string} fileExtension
 * @returns {{ uploadUrl: string, publicUrl: string, key: string, uploadToken: string }}
 */
export function getWorkerUploadUrl(courseCode, fileUuid, fileExtension) {
    const key = buildObjectKey(courseCode, fileUuid, fileExtension);
    const workerBase = process.env.R2_WORKER_URL;
    const uploadToken = process.env.R2_UPLOAD_SECRET;
    const uploadUrl = `${workerBase}/upload/${encodeURIComponent(key)}`;
    const publicUrl = getPublicUrl(courseCode, fileUuid, fileExtension);

    return { uploadUrl, publicUrl, key, uploadToken };
}
