import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const widgetPath = join(process.cwd(), '../../packages/widget/dist/widget.js');
    const content = readFileSync(widgetPath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('// Widget not built yet', {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
}
