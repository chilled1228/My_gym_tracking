import { clearAllProgressData } from '../lib/database';

async function main() {
  console.log('Starting to clear all progress data...');
  
  try {
    const result = await clearAllProgressData();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
    } else {
      console.error('❌ Error:', result.message);
    }
    
    if (result.details) {
      console.log('\nDetails:');
      Object.entries(result.details).forEach(([table, status]) => {
        const icon = status.success ? '✅' : '❌';
        console.log(`${icon} ${table}:`, status.success ? 'Cleared' : `Failed - ${status.error}`);
      });
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 