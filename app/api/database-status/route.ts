import { NextResponse } from 'next/server';
import { setupSupabaseTables } from '@/lib/setup-supabase';

export async function GET() {
  try {
    const result = await setupSupabaseTables();
    
    // Return with cache control headers to prevent caching
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error checking database: ${error instanceof Error ? error.message : String(error)}` 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 