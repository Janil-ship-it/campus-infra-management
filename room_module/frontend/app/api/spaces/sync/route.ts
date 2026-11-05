import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { syncFromExcel, syncFromGoogleSheet } from '@/lib/spaces';

/**
 * POST /api/spaces/sync
 * Admin only: refresh all_spaces.json from the configured spreadsheet source.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('iitgn_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Login as admin to sync spreadsheet data' }, { status: 401 });
    }
    const data = JSON.parse(session.value);
    if (data.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can sync spreadsheet data' }, { status: 403 });
    }

    const result = process.env.GOOGLE_APPS_SCRIPT_URL
      ? await syncFromGoogleSheet(process.env.GOOGLE_APPS_SCRIPT_URL)
      : syncFromExcel();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: process.env.GOOGLE_APPS_SCRIPT_URL
        ? `Synced ${result.count} rooms from Google Sheets`
        : `Synced ${result.count} rooms from Excel`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
