import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DiscoveryRequest {
  tenant_id: string;
  hs_codes?: string[];
  keywords?: string[];
  countries?: string[];
  limit?: number;
}

interface CandidateCompany {
  company_name: string;
  domain?: string;
  country?: string;
  city?: string;
  industry?: string;
  company_type?: string;
  source: string;
  snippet?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const payload = await req.json() as DiscoveryRequest;
    if (!payload?.tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const limit = payload.limit ?? 20;
    
    // MOTOR TRADE: Focar em DADOS DE TRADE REAIS (ImportGenius, Panjiva, Volza, etc.)
    console.log(`[MOTOR-TRADE] 🚢 Buscando importadores reais via dados de trade...`);
    console.log(`  HS Codes: ${payload.hs_codes?.join(', ') || 'N/A'}`);
    console.log(`  Países: ${payload.countries?.join(', ') || 'N/A'}`);
    console.log(`  Keywords: ${payload.keywords?.join(', ') || 'N/A'}`);
    
    const candidateSources = await Promise.all([
      runTradeDataSearch(payload), // NOVO: Busca em portais de trade data
      runSerperTradeSearch(payload), // Modificado: Focar em portais de trade
      runGoogleCSESearch(payload), // Fallback: Google CSE com foco em trade
    ]);

    const merged = deduplicateCandidates(candidateSources.flat()).slice(0, limit);

    if (merged.length === 0) {
      return new Response(JSON.stringify({ success: true, inserted: [], message: "No candidates found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upsertPayload = merged.map((company) => ({
      tenant_id: payload.tenant_id,
      company_name: company.company_name,
      domain: company.domain,
      country: company.country,
      city: company.city,
      industry: company.industry,
      company_type: company.company_type ?? "importer", // Motor Trade = sempre importer
      sources: {
        discovery: {
          source: company.source,
          snippet: company.snippet,
          engine: "motor-trade", // Identificar motor usado
        },
      },
      enrichment_stage: "discovery",
      status: "pending",
    }));

    // Estratégia: verificar existência usando colunas reais (domain_key é gerado, não pode filtrar diretamente)
    const inserted: any[] = [];
    for (const item of upsertPayload) {
      try {
        // Buscar por domain OU por company_name+country (as colunas reais)
        let query = supabase
          .from("global_companies")
          .select("id")
          .eq("tenant_id", payload.tenant_id);
        
        if (item.domain?.trim()) {
          query = query.eq("domain", item.domain.trim());
        } else {
          // Se não tem domain, buscar por nome+país
          query = query
            .eq("company_name", item.company_name)
            .eq("country", item.country || "");
        }
        
        const { data: existing } = await query.maybeSingle();
        
        if (existing) {
          // Já existe, pular
          continue;
        }
        
        // Inserir novo registro (sem onConflict - o índice único vai prevenir duplicatas)
        const { data, error } = await supabase
          .from("global_companies")
          .insert(item)
          .select()
          .single();
        
        if (!error && data) {
          inserted.push(data);
        } else if (error) {
          // Ignorar apenas erros de duplicata e foreign key (23505 = unique violation, 23503 = foreign key, 409 = conflict)
          if (error.code !== '23505' && error.code !== '23503' && error.status !== 409) {
            console.warn("[DISCOVERY] Erro ao inserir empresa:", error);
          } else if (error.code === '23503') {
            console.error("[DISCOVERY] Erro de foreign key - tenant_id inválido:", error.details);
          }
        }
      } catch (err: any) {
        // Ignorar erros de duplicata e foreign key silenciosamente
        if (err?.code !== '23505' && err?.code !== '23503' && err?.status !== 409) {
          console.warn("[DISCOVERY] Erro ao inserir empresa:", err);
        } else if (err?.code === '23503') {
          console.error("[DISCOVERY] Erro de foreign key - tenant_id inválido:", err?.details);
        }
      }
    }

    const data = inserted;
    const error = null;

    if (data && data.length > 0) {
      const logEntries = data.map((row) => ({
        company_id: row.id,
        stage: "discovery",
        status: "success",
        source: "discover-companies-global",
        payload: row.sources,
        finished_at: new Date().toISOString(),
      }));
      await supabase.from("global_enrichment_logs").insert(logEntries);
    }

    return new Response(JSON.stringify({ success: true, inserted: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DISCOVERY] Unexpected error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================================
// NOVA FUNÇÃO: Busca em portais de Trade Data (ImportGenius, Panjiva, Volza)
// ============================================================================

async function runTradeDataSearch(payload: DiscoveryRequest): Promise<CandidateCompany[]> {
  try {
    const apiKey = Deno.env.get("SERPER_API_KEY");
    if (!apiKey) return [];

    const hsCodes = payload.hs_codes || [];
    const countries = payload.countries || [];
    const keywords = payload.keywords || [];

    if (hsCodes.length === 0) {
      console.log("[TRADE-DATA] ⚠️ Sem HS Codes - pulando busca de trade data");
      return [];
    }

    console.log(`[TRADE-DATA] 🔍 Buscando importadores reais em portais de trade...`);

    // QUERIES FOCADAS EM PORTais DE TRADE DATA
    const queries: string[] = [];
    
    for (const hsCode of hsCodes.slice(0, 2)) { // Limitar a 2 HS Codes
      for (const country of countries.slice(0, 3)) { // Limitar a 3 países
        // ImportGenius
        queries.push(`site:importgenius.com HS ${hsCode} importer ${country}`);
        queries.push(`site:importgenius.com "${hsCode}" ${country} import`);
        
        // Panjiva
        queries.push(`site:panjiva.com HS ${hsCode} ${country} importer`);
        queries.push(`site:panjiva.com "${hsCode}" ${country} import`);
        
        // Volza
        queries.push(`site:volza.com HS ${hsCode} ${country} importer`);
        queries.push(`site:volza.com "${hsCode}" ${country} import`);
        
        // ImportKey
        queries.push(`site:importkey.com HS ${hsCode} ${country}`);
        queries.push(`site:importkey.com "${hsCode}" ${country} importer`);
        
        // Eximpedia
        queries.push(`site:eximpedia.app HS ${hsCode} ${country}`);
        
        // Com keywords
        if (keywords.length > 0) {
          const mainKeyword = keywords[0];
          queries.push(`site:importgenius.com "${mainKeyword}" HS ${hsCode} ${country}`);
          queries.push(`site:panjiva.com "${mainKeyword}" ${hsCode} ${country}`);
        }
      }
    }

    const allResults: CandidateCompany[] = [];
    const batchSize = 5;

    // Executar em batches para evitar rate limit
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (query) => {
          try {
            const response = await fetch("https://google.serper.dev/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
              },
              body: JSON.stringify({ q: query, num: 10, gl: "us", hl: "en" }),
            });

            if (response.ok) {
              const data = await response.json();
              return (data.organic || []).map((item: any) => ({
                company_name: extractCompanyNameFromTradeData(item.title, item.snippet),
                domain: extractDomain(item.link),
                country: inferCountryFromSnippet(item.snippet) || payload.countries?.[0],
                industry: inferIndustryFromSnippet(item.snippet),
                company_type: "importer", // Motor Trade = sempre importer
                source: "trade_data",
                snippet: item.snippet,
              }));
            }
          } catch (err) {
            console.error(`[TRADE-DATA] Query failed: ${query.substring(0, 50)}...`);
          }
          return [];
        })
      );

      allResults.push(...batchResults.flat());
      
      // Delay entre batches
      if (i + batchSize < queries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[TRADE-DATA] ✅ ${allResults.length} importadores encontrados em portais de trade`);
    return allResults;
  } catch (error) {
    console.error("[TRADE-DATA] Error", error);
    return [];
  }
}

function extractCompanyNameFromTradeData(title: string, snippet: string): string {
  // Tentar extrair nome da empresa de dados de trade
  // Ex: "Company ABC imported HS 95069100 from China" -> "Company ABC"
  const text = `${title} ${snippet}`;
  
  // Padrões comuns em dados de trade
  const patterns = [
    /^([A-Z][A-Za-z0-9\s&,.-]+?)\s+(?:imported|imports|importer|shipped|received)/i,
    /(?:Importer|Buyer|Consignee):\s*([A-Z][A-Za-z0-9\s&,.-]+?)(?:\s|$|,|\.)/i,
    /^([A-Z][A-Za-z0-9\s&,.-]{3,50}?)\s+(?:HS|HTS|Harmonized)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  // Fallback: usar título limpo
  return title?.replace(/-|–.*/g, "").trim() || "Unknown Importer";
}

// ============================================================================
// FUNÇÃO MODIFICADA: Serper focado em portais de trade
// ============================================================================

async function runSerperTradeSearch(payload: DiscoveryRequest): Promise<CandidateCompany[]> {
  try {
    const apiKey = Deno.env.get("SERPER_API_KEY");
    if (!apiKey) return [];

    const hsCodes = payload.hs_codes || [];
    const countries = payload.countries || [];
    const keywords = payload.keywords || [];

    // QUERIES FOCADAS EM PORTais DE TRADE E DIRETÓRIOS B2B
    const queries: string[] = [];

    // Portais de Trade Data
    const tradePortals = [
      'importgenius.com', 'panjiva.com', 'volza.com', 
      'importkey.com', 'eximpedia.app', 'trademap.org'
    ];

    for (const portal of tradePortals) {
      if (hsCodes.length > 0) {
        queries.push(`site:${portal} HS ${hsCodes[0]} ${countries[0] || ''}`);
      }
      if (keywords.length > 0) {
        queries.push(`site:${portal} "${keywords[0]}" importer ${countries[0] || ''}`);
      }
    }

    // Diretórios B2B focados em trade
    const b2bDirectories = [
      'kompass.com', 'europages.com', 'thomasnet.com', 
      'tradekey.com', 'alibaba.com/trade', 'globalsources.com'
    ];

    for (const directory of b2bDirectories) {
      if (keywords.length > 0) {
        queries.push(`site:${directory} "${keywords[0]}" importer ${countries[0] || ''}`);
      }
    }

    if (queries.length === 0) return [];

    const allResults: CandidateCompany[] = [];
    const batchSize = 5;

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (query) => {
          try {
            const response = await fetch("https://google.serper.dev/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
              },
              body: JSON.stringify({ q: query, num: 10, gl: "us", hl: "en" }),
            });

            if (response.ok) {
              const data = await response.json();
              return (data.organic || [])
                .filter((item: any) => {
                  // Filtrar Facebook, Instagram, etc.
                  const link = (item.link || '').toLowerCase();
                  const blocked = ['facebook.com', 'instagram.com', 'linkedin.com', 
                                  'youtube.com', 'faire.com', 'etsy.com'];
                  if (blocked.some(b => link.includes(b))) return false;
                  if (link.includes('/posts/') || link.includes('/videos/') || 
                      link.includes('/groups/') || link.includes('/people/') ||
                      link.includes('/p/')) return false;
                  return true;
                })
                .map((item: any) => ({
                  company_name: extractCompanyNameFromTradeData(item.title, item.snippet),
                  domain: extractDomain(item.link),
                  country: inferCountryFromSnippet(item.snippet) || payload.countries?.[0],
                  industry: inferIndustryFromSnippet(item.snippet),
                  company_type: "importer",
                  source: "serper_trade",
                  snippet: item.snippet,
                }));
            }
          } catch (err) {
            console.error(`[SERPER-TRADE] Query failed: ${query.substring(0, 50)}...`);
          }
          return [];
        })
      );

      allResults.push(...batchResults.flat());
      
      if (i + batchSize < queries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[SERPER-TRADE] ✅ ${allResults.length} resultados de portais de trade`);
    return allResults;
  } catch (error) {
    console.error("[SERPER-TRADE] Error", error);
    return [];
  }
}

async function runGoogleCSESearch(payload: DiscoveryRequest): Promise<CandidateCompany[]> {
  try {
    const apiKey = Deno.env.get("GOOGLE_CSE_API_KEY");
    const cx = Deno.env.get("GOOGLE_CSE_ID");
    if (!apiKey || !cx) return [];

    // MOTOR TRADE: Focar em importadores reais
    const queryParts: string[] = [];
    if (payload.hs_codes?.length) {
      queryParts.push(`HS ${payload.hs_codes[0]}`); // Focar no primeiro HS Code
    }
    if (payload.keywords?.length) {
      queryParts.push(payload.keywords[0]); // Focar na primeira keyword
    }
    if (payload.countries?.length) {
      queryParts.push(payload.countries[0]); // Focar no primeiro país
    }
    queryParts.push("importer OR import OR imported");
    queryParts.push("-site:alibaba.com -site:made-in-china.com -site:ebay.com");
    queryParts.push("-site:facebook.com -site:instagram.com");

    const q = encodeURIComponent(queryParts.join(" "));
    const response = await fetch(`https://customsearch.googleapis.com/customsearch/v1?q=${q}&cx=${cx}&key=${apiKey}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items) return [];

    return data.items
      .filter((item: any) => {
        // Filtrar Facebook, Instagram, etc.
        const link = (item.link || '').toLowerCase();
        const blocked = ['facebook.com', 'instagram.com', 'linkedin.com', 
                        'youtube.com', 'faire.com', 'etsy.com'];
        if (blocked.some(b => link.includes(b))) return false;
        if (link.includes('/posts/') || link.includes('/videos/') || 
            link.includes('/groups/') || link.includes('/people/') ||
            link.includes('/p/')) return false;
        return true;
      })
      .map((item: any) => ({
        company_name: extractCompanyNameFromTradeData(item.title, item.snippet) || 
                      item.title?.replace(/-|–.*/g, "").trim() || item.title,
        domain: extractDomain(item.link),
        country: inferCountryFromSnippet(item.snippet) || payload.countries?.[0],
        industry: inferIndustryFromSnippet(item.snippet),
        company_type: "importer", // Motor Trade = sempre importer
        source: "google_cse_trade",
        snippet: item.snippet,
      }));
  } catch (error) {
    console.error("[DISCOVERY] Google CSE error", error);
    return [];
  }
}

// REMOVIDO: runSerperSearch substituído por runSerperTradeSearch (focado em trade)

async function buildKeywordFallback(payload: DiscoveryRequest): Promise<CandidateCompany[]> {
  const keywords = payload.keywords ?? [];
  if (keywords.length === 0) return [];

  const baseDomain = (keywords[0] ?? "dealer").replace(/\s+/g, "");
  const country = payload.countries?.[0];

  return [
    {
      company_name: `${baseDomain.toUpperCase()} Global Imports`,
      domain: `${baseDomain.toLowerCase()}-imports.com`,
      country,
      industry: "Trade",
      company_type: "importer",
      source: "ai_fallback",
      snippet: "Lead gerado automaticamente a partir de palavras-chave.",
    },
  ];
}

function deduplicateCandidates(candidates: CandidateCompany[]): CandidateCompany[] {
  const seen = new Map<string, CandidateCompany>();
  for (const candidate of candidates) {
    if (!candidate.company_name) continue;
    const key =
      candidate.domain?.toLowerCase() ??
      `${candidate.company_name.toLowerCase()}|${candidate.country ?? ""}`;
    if (!seen.has(key)) {
      seen.set(key, candidate);
    }
  }
  return Array.from(seen.values());
}

function extractDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function inferCountryFromSnippet(snippet?: string): string | undefined {
  if (!snippet) return undefined;
  const countries = ["Brazil", "Argentina", "USA", "Canada", "Germany", "Spain", "China"];
  return countries.find((country) => snippet.includes(country));
}

function inferIndustryFromSnippet(snippet?: string): string | undefined {
  if (!snippet) return undefined;
  if (snippet.toLowerCase().includes("pilates")) return "Pilates / Fitness";
  if (snippet.toLowerCase().includes("medical")) return "Medical";
  if (snippet.toLowerCase().includes("equipment")) return "Equipment";
  return undefined;
}


