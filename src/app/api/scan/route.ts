import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Ensure URL has protocol
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    try {
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${apiKey}&category=seo&category=performance`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        const lighthouseResult = data.lighthouseResult;
        const audits = lighthouseResult.audits;
        const categories = lighthouseResult.categories;

        const lcp = audits['largest-contentful-paint'].displayValue;
        const cls = audits['cumulative-layout-shift'].displayValue;
        const seoScore = categories.seo.score * 100;

        return NextResponse.json({
            lcp,
            cls,
            seoScore
        });
    } catch (error) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: 'Failed to scan URL' }, { status: 500 });
    }
}
