import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user.json');
    const data = await fs.readFile(filePath, 'utf8');
    const user = JSON.parse(data);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error reading user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
