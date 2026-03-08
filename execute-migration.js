#!/usr/bin/env node

/**
 * Script para ejecutar la migración SQL de profile_actions en Supabase
 * Uso: node execute-migration.js
 */

const { Client } = require('pg');

const client = new Client({
  host: 'db.bbhmbnhbzhbyktztdrhu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'claude',
  password: 'claude_cumpleanitos_2026',
});

const sqls = [
  `CREATE TABLE IF NOT EXISTS profile_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_label TEXT NOT NULL,
    action_description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, action_type)
  );`,

  `CREATE INDEX IF NOT EXISTS profile_actions_user_id_idx ON profile_actions(user_id);`,

  `CREATE INDEX IF NOT EXISTS profile_actions_completed_idx ON profile_actions(user_id, is_completed);`,

  `CREATE OR REPLACE FUNCTION update_profile_actions_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;`,

  `DROP TRIGGER IF EXISTS profile_actions_updated_at ON profile_actions;
  CREATE TRIGGER profile_actions_updated_at
  BEFORE UPDATE ON profile_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_actions_timestamp();`
];

async function run() {
  try {
    console.log('🚀 Conectando a Supabase...');
    await client.connect();
    console.log('✓ Conectado\n');

    console.log('📝 Ejecutando migraciones SQL...\n');
    for (let i = 0; i < sqls.length; i++) {
      await client.query(sqls[i]);
      console.log(`✓ Query ${i + 1}/${sqls.length} ejecutada`);
    }

    console.log('\n✅ ¡Migración SQL completada exitosamente!');
    console.log('🎉 Las tablas profile_actions están listas');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
