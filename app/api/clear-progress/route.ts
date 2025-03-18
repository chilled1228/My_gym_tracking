import { NextRequest, NextResponse } from 'next/server';
import { clearAllProgressData } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add some basic auth or API key check here
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    // Clear all progress data
    const result = await clearAllProgressData();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error in clear progress API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to clear progress: ${error instanceof Error ? error.message : String(error)}` 
      }, 
      { status: 500 }
    );
  }
} 