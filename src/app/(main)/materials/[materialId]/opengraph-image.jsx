import { ImageResponse } from 'next/og';
import { db, eq } from '@/lib/db';
import { courseMaterials } from '@/lib/db/schema';

export const alt = 'Course Material';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }) {
    const { materialId } = await params;

    const [material] = await db
        .select({
            courseCode: courseMaterials.courseCode,
            postDescription: courseMaterials.postDescription,
            fileExtension: courseMaterials.fileExtension,
        })
        .from(courseMaterials)
        .where(eq(courseMaterials.materialId, materialId));

    if (!material) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 48,
                        background: '#111827',
                        color: '#f9fafb',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    Material Not Found
                </div>
            ),
            { ...size }
        );
    }

    const description = material.postDescription?.length > 100
        ? material.postDescription.slice(0, 100) + '...'
        : material.postDescription;

    const fileLabel = material.fileExtension?.toUpperCase() || 'FILE';

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom, #030712, #111827, #0f172a)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif',
                    padding: '60px',
                }}
            >
                {/* Left side — details */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        maxWidth: '550px',
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            background: '#1e3a8a',
                            borderRadius: '20px',
                            marginBottom: '24px',
                            boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.5)',
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                    </div>

                    {/* Title */}
                    <h1
                        style={{
                            fontSize: 56,
                            fontWeight: 800,
                            color: '#f9fafb',
                            lineHeight: 1.1,
                            marginBottom: '8px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Course Material
                    </h1>

                    {/* Subtitle */}
                    <p
                        style={{
                            fontSize: 28,
                            color: '#9ca3af',
                            marginTop: 0,
                            marginBottom: 0,
                        }}
                    >
                        {description}
                    </p>
                </div>

                {/* Right side — document visual */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#1f2937',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                        border: '1px solid #374151',
                        width: '400px',
                    }}
                >
                    {/* Faux document header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#1d4ed8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb' }}>{material.courseCode}</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', background: '#1e3a5f', padding: '3px 10px', borderRadius: '6px' }}>{fileLabel}</span>
                            </div>
                            <span style={{ fontSize: 14, color: '#6b7280' }}>Document</span>
                        </div>
                    </div>

                    {/* Faux document lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '100%' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '85%' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '92%' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '78%' }} />
                        <div style={{ height: '24px' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '95%' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '88%' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '70%' }} />
                        <div style={{ height: '24px' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '90%' }} />
                        <div style={{ height: '10px', background: '#374151', borderRadius: '5px', width: '65%' }} />
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
