import { NextResponse } from 'next/server';
import { pool } from '../../../../src/lib/db';
import { ApiError, apiError, readJson } from '../../../../src/lib/api';
import { requireAdmin } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    await requireAdmin(request);
    const { rows } = await pool.query(
      `SELECT setting_key, setting_value FROM site_settings
       WHERE setting_key IN ('site_name', 'catalog_button_label')`,
    );
    return NextResponse.json(
      Object.fromEntries(
        rows.map(({ setting_key, setting_value }) => [setting_key, setting_value]),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request) {
  try {
    await requireAdmin(request);
    const body = await readJson(request);
    const siteName =
      typeof body.site_name === 'string' ? body.site_name.trim() : '';
    const catalogButtonLabel =
      typeof body.catalog_button_label === 'string'
        ? body.catalog_button_label.trim()
        : '';

    if (
      !siteName ||
      !catalogButtonLabel ||
      siteName.length > 40 ||
      catalogButtonLabel.length > 40
    ) {
      throw new ApiError('Both names are required and must be 40 characters or fewer.');
    }

    await pool.query(
      `INSERT INTO site_settings(setting_key, setting_value)
       VALUES ('site_name', $1), ('catalog_button_label', $2)
       ON CONFLICT (setting_key) DO UPDATE
       SET setting_value = EXCLUDED.setting_value`,
      [siteName, catalogButtonLabel],
    );
    return NextResponse.json({
      site_name: siteName,
      catalog_button_label: catalogButtonLabel,
    });
  } catch (error) {
    return apiError(error);
  }
}
