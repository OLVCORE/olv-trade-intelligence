// SCRIPT: Busca Global de Dealers MetaLife
// Executa buscas multi-source em todos os países prioritários

const SUPABASE_URL = 'https://kdalsopwfkrxiaxxophh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYWxzb3B3ZmtyeGlheHhvcGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzAxMzYsImV4cCI6MjA3ODQwNjEzNn0.chAVNaYFfgFm0PPWydVIMh1oWGuBTx0Pz6WdLEHvuNA';

const COUNTRIES = [
  { code: 'US', name: 'United States', tier: 1 },
  { code: 'CA', name: 'Canada', tier: 1 },
  { code: 'MX', name: 'Mexico', tier: 1 },
  { code: 'GB', name: 'United Kingdom', tier: 1 },
  { code: 'DE', name: 'Germany', tier: 1 },
  { code: 'FR', name: 'France', tier: 1 },
  { code: 'ES', name: 'Spain', tier: 1 },
  { code: 'IT', name: 'Italy', tier: 1 },
  { code: 'AU', name: 'Australia', tier: 1 },
  { code: 'CL', name: 'Chile', tier: 2 },
  { code: 'AR', name: 'Argentina', tier: 2 },
  { code: 'CO', name: 'Colombia', tier: 2 },
];

async function buscarDealers(country) {
  console.log(`\n🌍 Buscando: ${country.name}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/multi-source-dealer-discovery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: country.name,
        mode: 'full',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log(`✅ ${country.name}: ${data.total} dealers qualificados`);
    console.log(`   Tier A: ${data.stats.tier_A || 0}`);
    console.log(`   Tier B: ${data.stats.tier_B || 0}`);
    console.log(`   Créditos: ${data.stats.credits_apollo}`);
    console.log(`   Taxa: ${data.stats.qualification_rate}`);
    
    return {
      country: country.name,
      ...data,
    };
    
  } catch (error) {
    console.error(`❌ Erro em ${country.name}:`, error.message);
    return {
      country: country.name,
      error: error.message,
      dealers: [],
      total: 0,
    };
  }
}

async function main() {
  console.log('🚀 BUSCA GLOBAL DE DEALERS METALIFE');
  console.log('=====================================\n');
  
  const allResults = [];
  let totalDealers = 0;
  let totalCredits = 0;
  
  for (const country of COUNTRIES) {
    const result = await buscarDealers(country);
    allResults.push(result);
    
    totalDealers += result.total || 0;
    totalCredits += result.stats?.credits_apollo || 0;
    
    // Aguardar 5s entre buscas
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\n\n📊 RESUMO GLOBAL:');
  console.log('==================');
  console.log(`Total Dealers: ${totalDealers}`);
  console.log(`Total Créditos Apollo: ${totalCredits}`);
  console.log(`Custo estimado: USD ${(totalCredits * 0.10).toFixed(2)}`);
  
  // Salvar consolidado
  const fs = require('fs');
  fs.writeFileSync('dealers_global_consolidado.json', JSON.stringify({
    metadata: {
      totalDealers,
      totalCredits,
      costUSD: totalCredits * 0.10,
      executedAt: new Date().toISOString(),
      countries: COUNTRIES.length,
    },
    results: allResults,
  }, null, 2));
  
  console.log('\n✅ Salvo em: dealers_global_consolidado.json');
}

main().catch(console.error);

