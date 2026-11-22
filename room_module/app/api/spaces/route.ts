import { NextResponse } from 'next/server';
import { getSpaces, syncFromGoogleSheet } from '@/lib/spaces';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceSync = searchParams.get('sync') === '1';
    const result = forceSync && process.env.GOOGLE_APPS_SCRIPT_URL
      ? await syncFromGoogleSheet(process.env.GOOGLE_APPS_SCRIPT_URL)
      : getSpaces({ forceSync });

    if ('ok' in result && !result.ok) {
      return NextResponse.json(
        { data: [], error: result.error, source: 'empty', synced: false, count: 0 },
        { status: 502 },
      );
    }

    const records = result.records ?? [];

    return NextResponse.json({
      data: records,
      source: 'ok' in result ? 'google-sheets' : result.source,
      synced: ('ok' in result) ? true : result.synced ?? false,
      error: ('ok' in result) ? null : result.error ?? null,
      count: records.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load spaces';
    return NextResponse.json(
      { data: [], error: message, count: 0 },
      { status: 500 }
    );
  }
}
