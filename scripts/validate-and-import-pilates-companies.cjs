#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = 'https://kdalsopwfkrxiaxxophh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYWxzb3B3ZmtyeGlheHhvcGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzAxMzYsImV4cCI6MjA3ODQwNjEzNn0.chAVNaYFfgFm0PPWydVIMh1oWGuBTx0Pz6WdLEHvuNA';

const CSV_FILE = '50_EMPRESAS_PILATES_REAIS.csv';

// ============================================================================
// LER CSV
// ============================================================================

function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  
  const companies = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const company = {
      company_name: values[0],
      website: values[1],
      country: values[2],
      city: values[3],
      type: values[4],
      notes: values[5] || '',
    };
    companies.push(company);
  }
  
  return companies;
}

// ============================================================================
// CHAMAR EDGE FUNCTION
// ============================================================================

async function validateCompanies(companies) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ companies });
    
    const options = {
      hostname: 'kdalsopwfkrxiaxxophh.supabase.co',
      port: 443,
      path: '/functions/v1/validate-pilates-companies',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
}

// ============================================================================
// GERAR SQL
// ============================================================================

function generateSQL(companies) {
  const tenantId = '2afccefc-011a-4fb4-98e1-c47994b6f137';
  const workspaceId = '24bd0fad-93e6-4595-b17c-dcf7d6bc8095'; // Export - Global
  
  let sql = `-- ============================================================================\n`;
  sql += `-- IMPORTAR ${companies.length} DEALERS PILATES VALIDADOS\n`;
  sql += `-- Gerado automaticamente com scraping de websites\n`;
  sql += `-- ============================================================================\n\n`;
  
  sql += `DO $$ \n`;
  sql += `DECLARE\n`;
  sql += `  v_tenant_id UUID := '${tenantId}';\n`;
  sql += `  v_workspace_id UUID := '${workspaceId}';\n`;
  sql += `BEGIN\n\n`;
  
  sql += `  INSERT INTO public.companies (\n`;
  sql += `    tenant_id,\n`;
  sql += `    workspace_id,\n`;
  sql += `    company_name,\n`;
  sql += `    website,\n`;
  sql += `    country,\n`;
  sql += `    city,\n`;
  sql += `    industry,\n`;
  sql += `    international_data\n`;
  sql += `  ) VALUES\n`;
  
  const values = companies.map((c, i) => {
    const intData = JSON.stringify({
      fit_score: c.fitScore,
      pilates_keywords: c.pilatesKeywords,
      validated: true,
      type: c.type,
      notes: c.notes,
      source: 'manual_validated_list',
    }).replace(/'/g, "''");
    
    return `  (v_tenant_id, v_workspace_id, '${c.company_name.replace(/'/g, "''")}', '${c.website}', '${c.country}', '${c.city}', 'sporting goods', '${intData}'::jsonb)`;
  });
  
  sql += values.join(',\n');
  sql += `;\n\n`;
  
  sql += `  RAISE NOTICE '✅ ${companies.length} dealers Pilates importados!';\n`;
  sql += `END $$;\n\n`;
  
  // SELECT para verificar
  sql += `-- VERIFICAR\n`;
  sql += `SELECT \n`;
  sql += `  company_name,\n`;
  sql += `  country,\n`;
  sql += `  website,\n`;
  sql += `  (international_data->>'fit_score')::integer as fit_score,\n`;
  sql += `  international_data->'pilates_keywords' as keywords\n`;
  sql += `FROM public.companies\n`;
  sql += `WHERE tenant_id = '${tenantId}'\n`;
  sql += `  AND (international_data->>'validated')::boolean = true\n`;
  sql += `ORDER BY (international_data->>'fit_score')::integer DESC;\n`;
  
  return sql;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 [SCRIPT] Iniciando validação de 50 empresas Pilates...\n');
  
  // 1. Ler CSV
  console.log('📄 [SCRIPT] Lendo CSV...');
  const companies = parseCSV(CSV_FILE);
  console.log(`✅ [SCRIPT] ${companies.length} empresas carregadas\n`);
  
  // 2. Validar via Edge Function
  console.log('🔍 [SCRIPT] Validando websites (fazendo scraping)...');
  console.log('⏳ [SCRIPT] Isso vai levar ~2 minutos...\n');
  
  try {
    const result = await validateCompanies(companies);
    
    console.log(`\n✅ [SCRIPT] Validação completa!`);
    console.log(`📊 [SCRIPT] Resultados:`);
    console.log(`   Total: ${result.total}`);
    console.log(`   Dealers Pilates: ${result.pilatesDealers}`);
    console.log(`   Taxa: ${((result.pilatesDealers / result.total) * 100).toFixed(0)}%\n`);
    
    // 3. Gerar SQL
    const sql = generateSQL(result.pilatesDealersOnly);
    fs.writeFileSync('IMPORTAR_50_PILATES_VALIDADOS.sql', sql);
    
    console.log('💾 [SCRIPT] SQL gerado: IMPORTAR_50_PILATES_VALIDADOS.sql');
    console.log(`✅ [SCRIPT] ${result.pilatesDealers} dealers prontos para importar!\n`);
    
    // 4. Estatísticas
    console.log('📊 [SCRIPT] Top 10 Fit Scores:');
    result.pilatesDealersOnly
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 10)
      .forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.company_name} (${c.country}): ${c.fitScore} pts`);
      });
    
  } catch (error) {
    console.error('\n❌ [SCRIPT] Erro:', error);
    process.exit(1);
  }
}

main();

