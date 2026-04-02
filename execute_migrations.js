import fetch from 'node-fetch';

const SUPABASE_URL = 'https://bbhmbnhbzhbyktztdrhu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaG1ibmhiemhieWt0enRkcmh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyODc5OCwiZXhwIjoyMDg4NDA0Nzk4fQ.P4aRPrpFEqf1cBre4BlAUPgFzxjYlLfiSp613awDLC8';

async function executeMigration(sql, name) {
  console.log(`\n🔄 Ejecutando: ${name}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    const result = await response.text();
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status}`);
      console.error(result);
      return false;
    }
    
    console.log(`✅ ${name} ejecutado correctamente`);
    if (result) console.log(`   Resultado: ${result}`);
    return true;
  } catch (error) {
    console.error(`❌ Error ejecutando ${name}:`, error.message);
    return false;
  }
}

async function main() {
  const fs = await import('fs');
  
  console.log('🚀 FASE 1 - Migrations v0.11\n');
  
  // Step 1: CREATE VIEW
  const step1 = fs.readFileSync('migrations/2026-04-02_v0.11-step1-create-view.sql', 'utf8');
  const success1 = await executeMigration(step1, 'Step 1: CREATE VIEW profiles_with_auth');
  
  if (!success1) {
    console.error('\n❌ Step 1 falló. Abortando.');
    process.exit(1);
  }
  
  // Step 2: FIX TRIGGER
  const step2 = fs.readFileSync('migrations/2026-04-02_v0.11-step2-fix-trigger.sql', 'utf8');
  const success2 = await executeMigration(step2, 'Step 2: FIX TRIGGER handle_new_user');
  
  if (!success2) {
    console.error('\n❌ Step 2 falló. Revisar trigger.');
    process.exit(1);
  }
  
  console.log('\n✅ FASE 1 completada exitosamente');
  console.log('📋 Próximo paso: Probar Google OAuth signup');
}

main();
