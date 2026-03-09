// src/lib/r2.js - Cloudflare R2 Storage Utility
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_EXTENSIONS = ['pdf', 'pptx', 'doc', 'docx'];

// R2_ENDPOINT may include a trailing path segment (e.g. /boracle) from the
// API-token scope.  The S3 SDK must receive just the origin so it can build
// path-style URLs like  <origin>/<bucket>/<key>.
const r2Origin = process.env.R2_ENDPOINT.replace(/\/[^/]+$/, '');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: r2Origin,
    // R2 only supports path-style addressing.  Without this the SDK turns
    // the bucket name into a subdomain that doesn't resolve in DNS, which
    // makes every browser request fail at the network level.
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    // Disable automatic CRC32 checksums in presigned URLs — R2 doesn't
    // fully support them and they cause browser uploads to fail.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
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
 * Generate a presigned PUT URL so the client can upload directly to R2.
 * @param {string} courseCode
 * @param {string} fileUuid
 * @param {string} fileExtension
 * @param {string} contentType - MIME type the client will upload
 * @param {number} [expiresIn=300] - URL validity in seconds (default 5 min)
 * @returns {Promise<{presignedUrl: string, publicUrl: string, key: string}>}
 */
export async function getPresignedUploadUrl(courseCode, fileUuid, fileExtension, contentType, expiresIn = 300) {
    const key = buildObjectKey(courseCode, fileUuid, fileExtension);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    // Presigned URL uses the S3 API endpoint — CORS is configured via
    // PutBucketCors (see scripts/setR2Cors.js).
    // Sign content-type so R2 validates the exact type the browser sends.
    // Unset signableHeaders to avoid SDK defaults that R2 may not support.
    const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn,
        signableHeaders: new Set(['host', 'content-type']),
        unhoistableHeaders: new Set(['content-type']),
    });
    const publicUrl = getPublicUrl(courseCode, fileUuid, fileExtension);

    return { presignedUrl, publicUrl, key };
}
