#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';
const { Client } = pg;

const config = {
  host: 'db.bbhmbnhbzhbyktztdrhu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'claude',
  password: 'claude_cumpleanitos_2026',
  ssl: { rejectUnauthorized: false }
};

async function runMigration() {
  const client = new Client(config);

  try {
    console.log('\n🚀 EJECUTANDO MIGRACIÓN: Email como campo core\n');
    
    await client.connect();
    console.log('✅ Conectado a Supabase\n');

    // Leer el archivo de migración
    const migrationSQL = readFileSync('./migration-email-core.sql', 'utf8');
    
    // Ejecutar la migración
    console.log('📝 Ejecutando migración SQL...\n');
    await client.query(migrationSQL);
    
    console.log('✅ Migración ejecutada exitosamente\n');
    
    // Verificar que las columnas existen
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('email', 'email_verified')
      ORDER BY column_name;
    `);
    
    if (result.rows.length === 2) {
      console.log('✅ Columnas creadas:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    }
    
    // Verificar función RPC
    const funcResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'get_all_users_with_email';
    `);
    
    if (funcResult.rows.length > 0) {
      console.log('✅ Función RPC creada: get_all_users_with_email()');
    }
    
    // Contar usuarios con email
    const countResult = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(email) as with_email,
             COUNT(CASE WHEN email_verified THEN 1 END) as verified
      FROM profiles;
    `);
    
    const stats = countResult.rows[0];
    console.log('\n📊 Estadísticas:');
    console.log(`   - Total usuarios: ${stats.total}`);
    console.log(`   - Con email: ${stats.with_email}`);
    console.log(`   - Email verificado: ${stats.verified}`);
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.detail) console.error('Detalle:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
