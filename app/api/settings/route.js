import { NextResponse } from 'next/server';
import { pool } from '../../../src/lib/db';
import { apiError } from '../../../src/lib/api';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT setting_key, setting_value FROM site_settings
       WHERE setting_key IN ('site_name', 'catalog_button_label')`,
    );
    const settings = Object.fromEntries(
      rows.map(({ setting_key, setting_value }) => [setting_key, setting_value]),
    );
    return NextResponse.json({
      site_name: settings.site_name || 'WebMusic',
      catalog_button_label: settings.catalog_button_label || 'WebMusic',
    });
  } catch (error) {
    return apiError(error);
  }
}
