import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setupSupabaseTables } from '@/lib/setup-supabase';

// Create a Supabase client with the service role key for admin operations
const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Verify that tables exist after creation
async function verifyTablesExist(tableNames: string[]) {
  try {
    const supabaseAdmin = getServiceClient();
    const missingTables = [];
    
    for (const tableName of tableNames) {
      try {
        // Try to select from the table to see if it exists
        const { error } = await supabaseAdmin
          .from(tableName)
          .select('count')
          .limit(1)
          .single();
        
        // If there's an error that's not just "no rows found", the table might not exist
        if (error && error.code !== 'PGRST116' && (error.code === '42P01' || error.message.includes('does not exist'))) {
          missingTables.push(tableName);
        }
      } catch (error) {
        console.error(`Error checking table ${tableName}:`, error);
        missingTables.push(tableName);
      }
    }
    
    return {
      success: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    console.error('Error verifying tables:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the SQL script and table names from the request body
    const { sqlScript, tableNames } = await request.json();
    
    if (!sqlScript) {
      return NextResponse.json(
        { success: false, message: 'No SQL script provided' },
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
    
    // Get the service client
    const supabaseAdmin = getServiceClient();
    
    // Execute the SQL script
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Error executing SQL script:', error);
      return NextResponse.json(
        { success: false, message: `Error executing SQL script: ${error.message}` },
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
    
    // Verify that tables were actually created
    if (tableNames && Array.isArray(tableNames) && tableNames.length > 0) {
      // Wait a moment for tables to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verificationResult = await verifyTablesExist(tableNames);
      
      if (!verificationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Tables were not created successfully. Still missing: ${verificationResult.missingTables?.join(', ')}`,
            missingTables: verificationResult.missingTables
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
    }
    
    // Check database status after creation
    const databaseStatus = await setupSupabaseTables();
    
    return NextResponse.json(
      {
        success: true,
        message: 'SQL script executed successfully',
        databaseStatus
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
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error setting up database: ${error instanceof Error ? error.message : String(error)}` 
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