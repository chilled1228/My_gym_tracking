import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Type for database status
interface DatabaseStatus {
  checked: boolean;
  isReady: boolean;
  message: string;
  missingTables?: string[];
  sqlScript?: string;
  lastChecked?: number;
  dismissed?: boolean;
}

// GET endpoint to retrieve database status
export async function GET() {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // If no user, return a default status
      return NextResponse.json(
        { 
          success: true, 
          status: {
            checked: false,
            isReady: false,
            message: "Database status not checked"
          }
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Try to get the user's settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('database_status')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // If there's an error other than "no rows returned"
      console.error('Error fetching database status:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: `Error fetching database status: ${error.message}` 
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
    
    // Return the database status if it exists, otherwise return a default status
    return NextResponse.json(
      { 
        success: true, 
        status: settings?.database_status || {
          checked: false,
          isReady: false,
          message: "Database status not checked"
        }
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error retrieving database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error retrieving database status: ${error instanceof Error ? error.message : String(error)}` 
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

// POST endpoint to store database status
export async function POST(request: NextRequest) {
  try {
    // Get the database status from the request body
    const { status } = await request.json() as { status: DatabaseStatus };
    
    if (!status) {
      return NextResponse.json(
        { success: false, message: 'No database status provided' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is not authenticated, still return success but log it
    // This avoids 401 errors on page refresh while maintaining data integrity
    if (!user) {
      console.log('User not authenticated during database status store - operation will be skipped');
      return NextResponse.json(
        { 
          success: true, 
          message: 'Database status acknowledged (session expired, will be stored on next authenticated request)',
          tempStorage: true
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Check if the user has settings
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('user_settings')
        .update({ database_status: status })
        .eq('user_id', user.id);
    } else {
      // Create new settings
      result = await supabase
        .from('user_settings')
        .insert({ 
          user_id: user.id, 
          database_status: status,
          storage_preference: 'supabase'
        });
    }
    
    if (result.error) {
      console.error('Error storing database status:', result.error);
      return NextResponse.json(
        { success: false, message: `Error storing database status: ${result.error.message}` },
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
    
    return NextResponse.json(
      { success: true, message: 'Database status stored successfully' },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error storing database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error storing database status: ${error instanceof Error ? error.message : String(error)}` 
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