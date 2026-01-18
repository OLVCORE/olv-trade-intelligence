/**
 * AI SEARCH PLANNER
 * 
 * Usa GPT-4o-mini para GERAR UM PLANO DE BUSCA RESTRITIVO
 * baseado em HS + keywords + uso final + países, reduzindo lixo ANTES de buscar.
 * 
 * 🔒 BLINDADO: Planejamento de busca com IA (não alterar sem autorização)
 */

export interface SearchPlan {
  mustIncludePhrases: string[];          // exemplo: "pilates reformer distributor"
  mustExcludeTerms: string[];            // exemplo: "home gym", "dumbbell", "sitemap"
  countryLanguageStrategy: Record<string, string[]>; // ex: {"Chile":["es","en"]}
  queryTemplates: Array<{
    lang: string;
    template: string;  // ex: '("reformer" OR "cadillac") ("distributor" OR "importer") ("pilates studio" OR "professional") -("home gym" OR "retail")'
  }>;
  notes: string;
}

interface SearchPlanParams {
  hsCodes: string[];
  productKeywords: string[];
  usageInclude: string[];
  usageExclude?: string[];
  countries: string[];
}

/**
 * Cache simples em memória (apenas durante a sessão)
 */
const searchPlanCache = new Map<string, SearchPlan>();

/**
 * Gera chave de cache baseada nos parâmetros
 */
function getCacheKey(params: SearchPlanParams): string {
  return JSON.stringify({
    hs: params.hsCodes.sort().join(','),
    keywords: params.productKeywords.sort().join(','),
    include: params.usageInclude.sort().join(','),
    exclude: (params.usageExclude || []).sort().join(','),
    countries: params.countries.sort().join(','),
  });
}

/**
 * Regras de governança da IA:
 * - IA só roda se: usageInclude.length >= 1 (obrigatório) E (productKeywords.length >= 1 OU hsCodes.length >= 1)
 * - IA NÃO pode relaxar bloqueios
 * - IA NÃO pode remover "required keywords"; apenas sugerir reforços/combinações
 */
export async function generateSearchPlan(params: SearchPlanParams): Promise<SearchPlan | null> {
  // ✅ Validação obrigatória
  if (!params.usageInclude || params.usageInclude.length === 0) {
    console.warn('[AI-PLANNER] ⚠️ Uso final obrigatório não fornecido. Abortando planejamento.');
    return null;
  }
  
  if ((!params.productKeywords || params.productKeywords.length === 0) && 
      (!params.hsCodes || params.hsCodes.length === 0)) {
    console.warn('[AI-PLANNER] ⚠️ Nenhuma keyword ou HS Code fornecido. Abortando planejamento.');
    return null;
  }
  
  // ✅ Verificar cache
  const cacheKey = getCacheKey(params);
  if (searchPlanCache.has(cacheKey)) {
    console.log('[AI-PLANNER] ✅ Usando plano do cache');
    return searchPlanCache.get(cacheKey)!;
  }
  
  // ✅ Obter chave OpenAI (frontend: VITE_OPENAI_API_KEY)
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn('[AI-PLANNER] ⚠️ OPENAI_API_KEY não configurada. Retornando plano vazio.');
    return null;
  }
  
  try {
    // ✅ Construir prompt fixo (imutável)
    const prompt = buildSearchPlanPrompt(params);
    
    // ✅ Chamar OpenAI GPT-4o-mini
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um planejador de queries B2B especializado. Sua função é gerar um plano de busca RESTRITIVO e PRECISO para encontrar dealers, distribuidores e importadores B2B.

REGRAS OBRIGATÓRIAS:
1. Preserve a intenção econômica do usuário (uso final do produto)
2. Reforce termos de uso final obrigatórios
3. Reforce perfil B2B (distributor, wholesaler, dealer, importer, trading company, supplier, reseller, agent)
4. Gere exclusões FORTES (marketplaces, directories, datasources, e-commerce, B2C)
5. Gere variações por idioma (PT/EN/nativo do país)
6. Mantenha queries CURTAS, RESTRITIVAS, com frases compostas
7. NÃO inclua marketplaces, directories, data sources
8. NÃO generalize termos (ex: "fitness equipment" quando uso final é Pilates específico)

Formato de resposta: JSON estrito com:
- mustIncludePhrases: string[] (frases compostas obrigatórias)
- mustExcludeTerms: string[] (termos a excluir)
- queryTemplates: Array<{lang: string, template: string}> (templates de query por idioma)
- notes: string (observações breves)

Responda APENAS com JSON válido, sem markdown, sem texto adicional.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Baixa temperatura para consistência
        max_tokens: 450,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-PLANNER] ❌ OpenAI API error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('[AI-PLANNER] ❌ Resposta vazia da OpenAI');
      return null;
    }
    
    // ✅ Parse JSON (remover markdown se houver)
    let parsed: SearchPlan;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[AI-PLANNER] ❌ Erro ao parsear JSON:', parseError, content);
      return null;
    }
    
    // ✅ Validar estrutura mínima
    if (!parsed.mustIncludePhrases || !Array.isArray(parsed.mustIncludePhrases)) {
      parsed.mustIncludePhrases = [];
    }
    if (!parsed.mustExcludeTerms || !Array.isArray(parsed.mustExcludeTerms)) {
      parsed.mustExcludeTerms = [];
    }
    if (!parsed.queryTemplates || !Array.isArray(parsed.queryTemplates)) {
      parsed.queryTemplates = [];
    }
    if (!parsed.countryLanguageStrategy || typeof parsed.countryLanguageStrategy !== 'object') {
      parsed.countryLanguageStrategy = {};
    }
    if (!parsed.notes || typeof parsed.notes !== 'string') {
      parsed.notes = '';
    }
    
    // ✅ Salvar no cache
    searchPlanCache.set(cacheKey, parsed);
    
    console.log('[AI-PLANNER] ✅ Plano gerado:', {
      mustInclude: parsed.mustIncludePhrases.length,
      mustExclude: parsed.mustExcludeTerms.length,
      templates: parsed.queryTemplates.length,
    });
    
    return parsed;
  } catch (error: any) {
    console.error('[AI-PLANNER] ❌ Erro ao gerar plano:', error.message);
    return null;
  }
}

/**
 * Constrói prompt fixo (imutável) para o modelo
 */
function buildSearchPlanPrompt(params: SearchPlanParams): string {
  const hsCodesStr = params.hsCodes.length > 0 
    ? `HS Codes: ${params.hsCodes.join(', ')}\n` 
    : '';
  
  const keywordsStr = params.productKeywords.length > 0
    ? `Keywords do produto: ${params.productKeywords.join(', ')}\n`
    : '';
  
  const usageIncludeStr = `Uso final obrigatório (DEVE conter pelo menos 1): ${params.usageInclude.join(', ')}\n`;
  
  const usageExcludeStr = params.usageExclude && params.usageExclude.length > 0
    ? `Uso final excluído (NÃO pode conter nenhum): ${params.usageExclude.join(', ')}\n`
    : '';
  
  const countriesStr = `Países-alvo: ${params.countries.join(', ')}\n`;
  
  return `Gere um plano de busca RESTRITIVO para encontrar dealers/distribuidores B2B:

${hsCodesStr}${keywordsStr}${usageIncludeStr}${usageExcludeStr}${countriesStr}

REQUISITOS:
- mustIncludePhrases: Combine keywords + uso final + termos B2B (ex: "pilates reformer distributor", "construction equipment importer")
- mustExcludeTerms: Inclua marketplaces, directories, datasources, e-commerce, B2C, home gym, hobby, retail
- queryTemplates: Gere templates para PT, EN e idioma nativo dos países (espanhol para América Latina)
- notes: Explique brevemente a estratégia

Formato JSON estrito, sem markdown.`;
}
