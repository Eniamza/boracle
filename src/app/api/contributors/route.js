import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            // If a GITHUB_TOKEN is available, use it to increase rate limits
            ...(process.env.GITHUB_TOKEN && {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
            })
        };

        const response = await fetch('https://api.github.com/repos/Eniamza/boracle/contributors', {
            headers,
            next: { revalidate: 3600 } // Revalidate every hour to avoid hitting limits
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `GitHub API error: ${response.status} ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching contributors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contributors' },
            { status: 500 }
        );
    }
}
