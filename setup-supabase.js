#!/usr/bin/env node

/**
 * CUMPLEANITOS - Setup automático de Supabase
 *
 * Ejecuta TODAS las migraciones SQL y configura la BD
 *
 * Uso: npm install && node setup-supabase.js
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Configuración
const config = {
  host: process.env.DB_HOST || 'db.bbhmbnhbzhbyktztdrhu.supabase.co',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'claude',
  password: process.env.DB_PASSWORD || 'claude_cumpleanitos_2026',
  ssl: { rejectUnauthorized: false }
};

// Migraciones SQL
const migrations = [
  {
    name: 'Crear tabla profile_actions',
    sql: `CREATE TABLE IF NOT EXISTS profile_actions (
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
    );`
  },
  {
    name: 'Crear índice user_id',
    sql: `CREATE INDEX IF NOT EXISTS profile_actions_user_id_idx ON profile_actions(user_id);`
  },
  {
    name: 'Crear índice completed',
    sql: `CREATE INDEX IF NOT EXISTS profile_actions_completed_idx ON profile_actions(user_id, is_completed);`
  },
  {
    name: 'Crear función de timestamp',
    sql: `CREATE OR REPLACE FUNCTION update_profile_actions_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`
  },
  {
    name: 'Crear trigger de actualización',
    sql: `DROP TRIGGER IF EXISTS profile_actions_updated_at ON profile_actions;
    CREATE TRIGGER profile_actions_updated_at
    BEFORE UPDATE ON profile_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_actions_timestamp();`
  }
];

// Logger
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}\n`)
};

async function runMigrations() {
  const client = new Client(config);

  try {
    log.section('🚀 INICIANDO SETUP DE SUPABASE');

    log.info('Conectando a la base de datos...');
    await client.connect();
    log.success('Conectado a Supabase');

    log.section('📝 EJECUTANDO MIGRACIONES');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      try {
        await client.query(migration.sql);
        log.success(`[${i + 1}/${migrations.length}] ${migration.name}`);
      } catch (error) {
        log.error(`[${i + 1}/${migrations.length}] ${migration.name}: ${error.message}`);
        throw error;
      }
    }

    log.section('✓ VALIDACIÓN');

    // Verificar que la tabla existe
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'profile_actions';
    `);

    if (result.rows.length > 0) {
      log.success('Tabla profile_actions existe');
    } else {
      throw new Error('Tabla profile_actions no fue creada');
    }

    // Contar registros
    const countResult = await client.query('SELECT COUNT(*) as count FROM profile_actions;');
    log.success(`Registros en profile_actions: ${countResult.rows[0].count}`);

    log.section('🎉 SETUP COMPLETADO EXITOSAMENTE');
    log.success('Todas las migraciones se ejecutaron correctamente');
    log.success('Base de datos lista para producción');

    return true;

  } catch (error) {
    log.section('❌ ERROR EN SETUP');
    log.error(`${error.message}`);
    if (error.detail) log.error(`Detalle: ${error.detail}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar
runMigrations();
