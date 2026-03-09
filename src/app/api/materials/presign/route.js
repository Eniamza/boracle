// POST /api/materials/presign — Generate a presigned R2 upload URL
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isAllowedExtension, getPresignedUploadUrl } from '@/lib/r2';
import { randomUUID } from 'crypto';

const CONTENT_TYPE_MAP = {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileName, courseCode } = await req.json();

        if (!fileName || !courseCode) {
            return NextResponse.json({ error: 'Missing fileName or courseCode' }, { status: 400 });
        }

        const extension = fileName.split('.').pop()?.toLowerCase();
        if (!isAllowedExtension(extension)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only pdf, pptx, doc, and docx are allowed.' },
                { status: 400 }
            );
        }

        const fileUuid = randomUUID();
        const contentType = CONTENT_TYPE_MAP[extension] || 'application/octet-stream';

        const { presignedUrl, publicUrl } = await getPresignedUploadUrl(
            courseCode,
            fileUuid,
            extension,
            contentType
        );

        return NextResponse.json({
            presignedUrl,
            publicUrl,
            fileUuid,
            extension,
            contentType,
        });
    } catch (error) {
        console.error('Presign error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
