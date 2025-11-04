// 📱 SOCIAL MEDIA CONTENT ANALYZER - Lê conteúdo REAL das redes sociais
// Usa Jina AI + Serper para extrair posts, bio, sobre

import { supabase } from '@/integrations/supabase/client';

export interface SocialMediaContent {
  platform: 'linkedin' | 'instagram' | 'facebook' | 'twitter';
  bio?: string;
  about?: string;
  recentPosts: string[];
  followers?: number;
  engagement?: number;
  lastUpdate?: string;
}

export interface CompanyIntelligenceReport {
  companyName: string;
  digitalHealthScore: number; // 0-100
  googleCompliance: {
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
  socialMediaAnalysis: {
    platforms: SocialMediaContent[];
    overallPresence: 'excellent' | 'good' | 'poor' | 'absent';
    strengths: string[];
    weaknesses: string[];
  };
  aiInsights: {
    businessModel: string;
    targetAudience: string;
    keyProducts: string[];
    marketPosition: string;
    opportunities: string[];
    threats: string[];
  };
  executiveSummary: string;
}

/**
 * 🔍 ANALISA CONTEÚDO DO LINKEDIN
 */
async function analyzeLinkedInContent(linkedinUrl: string): Promise<SocialMediaContent> {
  console.log('[SOCIAL] 🔵 Analisando LinkedIn:', linkedinUrl);
  
  try {
    const jinaKey = import.meta.env.VITE_JINA_API_KEY;
    if (!jinaKey) throw new Error('JINA_API_KEY não configurada');

    const jinaUrl = `https://r.jina.ai/${linkedinUrl}`;
    const response = await fetch(jinaUrl, {
      headers: { 'Authorization': `Bearer ${jinaKey}` }
    });

    if (!response.ok) throw new Error('Erro ao buscar LinkedIn');

    const content = await response.text();
    
    // Extrair bio/about (primeiros 500 chars)
    const about = content.slice(0, 500);
    
    // Extrair posts recentes (buscar por padrões de posts)
    const posts: string[] = [];
    const postPattern = /post|activity|article/gi;
    const matches = content.match(new RegExp(`.{0,200}${postPattern.source}.{0,200}`, 'gi'));
    
    if (matches) {
      posts.push(...matches.slice(0, 5).map(m => m.trim()));
    }

    return {
      platform: 'linkedin',
      about,
      recentPosts: posts,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SOCIAL] ⚠️ LinkedIn falhou:', error);
    return {
      platform: 'linkedin',
      recentPosts: [],
    };
  }
}

/**
 * 🔍 ANALISA CONTEÚDO DO INSTAGRAM
 */
async function analyzeInstagramContent(instaUrl: string): Promise<SocialMediaContent> {
  console.log('[SOCIAL] 🟣 Analisando Instagram:', instaUrl);
  
  try {
    const jinaKey = import.meta.env.VITE_JINA_API_KEY;
    if (!jinaKey) throw new Error('JINA_API_KEY não configurada');

    const jinaUrl = `https://r.jina.ai/${instaUrl}`;
    const response = await fetch(jinaUrl, {
      headers: { 'Authorization': `Bearer ${jinaKey}` }
    });

    if (!response.ok) throw new Error('Erro ao buscar Instagram');

    const content = await response.text();
    
    // Extrair bio
    const bio = content.slice(0, 300);
    
    // Extrair posts recentes (captions)
    const posts: string[] = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.length > 50 && line.length < 300) {
        posts.push(line.trim());
      }
    });

    return {
      platform: 'instagram',
      bio,
      recentPosts: posts.slice(0, 5),
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SOCIAL] ⚠️ Instagram falhou:', error);
    return {
      platform: 'instagram',
      recentPosts: [],
    };
  }
}

/**
 * 🔍 ANALISA CONTEÚDO DO FACEBOOK
 */
async function analyzeFacebookContent(fbUrl: string): Promise<SocialMediaContent> {
  console.log('[SOCIAL] 🔵 Analisando Facebook:', fbUrl);
  
  try {
    const jinaKey = import.meta.env.VITE_JINA_API_KEY;
    if (!jinaKey) throw new Error('JINA_API_KEY não configurada');

    const jinaUrl = `https://r.jina.ai/${fbUrl}`;
    const response = await fetch(jinaUrl, {
      headers: { 'Authorization': `Bearer ${jinaKey}` }
    });

    if (!response.ok) throw new Error('Erro ao buscar Facebook');

    const content = await response.text();
    
    // Extrair about
    const about = content.slice(0, 400);
    
    // Extrair posts recentes
    const posts: string[] = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.length > 50 && line.length < 400) {
        posts.push(line.trim());
      }
    });

    return {
      platform: 'facebook',
      about,
      recentPosts: posts.slice(0, 5),
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SOCIAL] ⚠️ Facebook falhou:', error);
    return {
      platform: 'facebook',
      recentPosts: [],
    };
  }
}

/**
 * 🏥 WEBSITE HEALTH CHECK - Detecta erros e problemas
 */
async function checkWebsiteHealth(domain: string): Promise<{
  isOnline: boolean;
  hasErrors: boolean;
  errorKeywords: string[];
  googleCompliance: number;
  issues: string[];
}> {
  console.log('[HEALTH] 🏥 Verificando saúde do website:', domain);
  
  try {
    const jinaKey = import.meta.env.VITE_JINA_API_KEY;
    if (!jinaKey) throw new Error('JINA_API_KEY não configurada');

    const jinaUrl = `https://r.jina.ai/${domain}`;
    const response = await fetch(jinaUrl, {
      headers: { 'Authorization': `Bearer ${jinaKey}` }
    });

    if (!response.ok) {
      return {
        isOnline: false,
        hasErrors: true,
        errorKeywords: ['site offline', 'indisponível'],
        googleCompliance: 0,
        issues: ['Site fora do ar ou inacessível'],
      };
    }

    const content = await response.text().toLowerCase();
    
    // Detectar palavras de erro
    const errorKeywords = ['warning', 'error', 'forbidden', '403', '404', '500', 'indisponível', 'maintenance'];
    const foundErrors = errorKeywords.filter(kw => content.includes(kw));
    
    // Verificar compliance Google
    const complianceChecks = {
      hasTitle: content.includes('<title>') || content.includes('title'),
      hasDescription: content.includes('description'),
      hasKeywords: content.includes('keywords'),
      hasStructuredData: content.includes('schema.org') || content.includes('@type'),
      hasSSL: domain.startsWith('https'),
      hasMobileOptimized: content.includes('viewport') || content.includes('responsive'),
    };
    
    const complianceScore = Math.round(
      (Object.values(complianceChecks).filter(Boolean).length / Object.keys(complianceChecks).length) * 100
    );
    
    const issues: string[] = [];
    if (!complianceChecks.hasTitle) issues.push('❌ Title tag ausente ou inadequado');
    if (!complianceChecks.hasDescription) issues.push('❌ Meta description ausente');
    if (!complianceChecks.hasStructuredData) issues.push('⚠️ Structured Data (Schema.org) ausente');
    if (!complianceChecks.hasMobileOptimized) issues.push('⚠️ Otimização mobile questionável');
    if (foundErrors.length > 0) issues.push(`🚨 Erros detectados: ${foundErrors.join(', ')}`);

    return {
      isOnline: true,
      hasErrors: foundErrors.length > 0,
      errorKeywords: foundErrors,
      googleCompliance: complianceScore,
      issues,
    };
  } catch (error) {
    console.warn('[HEALTH] ⚠️ Health check falhou:', error);
    return {
      isOnline: false,
      hasErrors: true,
      errorKeywords: ['erro ao acessar'],
      googleCompliance: 0,
      issues: ['Não foi possível verificar o website'],
    };
  }
}

/**
 * 🧠 GERA COMPANY INTELLIGENCE REPORT COMPLETO (IA)
 */
export async function generateCompanyIntelligenceReport(
  companyName: string,
  website: string,
  linkedinUrl?: string,
  instagramUrl?: string,
  facebookUrl?: string
): Promise<CompanyIntelligenceReport> {
  console.log('[INTELLIGENCE] 🧠 Gerando relatório completo para:', companyName);

  // 1. Health Check do website
  const health = await checkWebsiteHealth(website);
  
  // 2. Análise de redes sociais
  const socialPlatforms: SocialMediaContent[] = [];
  
  if (linkedinUrl) {
    const linkedin = await analyzeLinkedInContent(linkedinUrl);
    socialPlatforms.push(linkedin);
  }
  
  if (instagramUrl) {
    const instagram = await analyzeInstagramContent(instagramUrl);
    socialPlatforms.push(instagram);
  }
  
  if (facebookUrl) {
    const facebook = await analyzeFacebookContent(facebookUrl);
    socialPlatforms.push(facebook);
  }

  // 3. Calcular presença geral
  const activePlatforms = socialPlatforms.filter(p => p.recentPosts.length > 0).length;
  const overallPresence: 'excellent' | 'good' | 'poor' | 'absent' = 
    activePlatforms >= 3 ? 'excellent' :
    activePlatforms === 2 ? 'good' :
    activePlatforms === 1 ? 'poor' : 'absent';

  // 4. IA ANALISA TUDO (GPT-4o-mini)
  const aiAnalysis = await analyzeWithAI(companyName, health, socialPlatforms);

  // 5. Digital Health Score
  const digitalHealthScore = Math.round(
    (health.googleCompliance * 0.4) + // 40% compliance Google
    (activePlatforms * 20) + // 20% por plataforma ativa
    (health.isOnline ? 20 : 0) // 20% se site no ar
  );

  return {
    companyName,
    digitalHealthScore,
    googleCompliance: {
      score: health.googleCompliance,
      issues: health.issues,
      recommendations: generateGoogleRecommendations(health),
    },
    socialMediaAnalysis: {
      platforms: socialPlatforms,
      overallPresence,
      strengths: aiAnalysis.strengths,
      weaknesses: aiAnalysis.weaknesses,
    },
    aiInsights: aiAnalysis.insights,
    executiveSummary: aiAnalysis.executiveSummary,
  };
}

/**
 * 🤖 IA ANALISA TODO O CONTEÚDO (GPT-4o-mini)
 */
async function analyzeWithAI(
  companyName: string,
  health: any,
  socialContent: SocialMediaContent[]
): Promise<any> {
  console.log('[AI] 🤖 Analisando com GPT-4o-mini...');

  try {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada');

    // Preparar contexto para IA
    const context = `
EMPRESA: ${companyName}

SAÚDE DO WEBSITE:
- Online: ${health.isOnline ? 'Sim' : 'Não'}
- Compliance Google: ${health.googleCompliance}%
- Erros detectados: ${health.errorKeywords.join(', ') || 'Nenhum'}
- Issues: ${health.issues.join(' | ')}

REDES SOCIAIS:
${socialContent.map(s => `
${s.platform.toUpperCase()}:
- Bio/Sobre: ${s.bio || s.about || 'N/A'}
- Posts recentes: ${s.recentPosts.join(' | ') || 'Nenhum'}
`).join('\n')}

ANALISE:
1. Qual o modelo de negócio desta empresa?
2. Qual o público-alvo?
3. Quais os principais produtos/serviços?
4. Qual a posição no mercado?
5. Quais oportunidades para TOTVS?
6. Quais ameaças/riscos?
7. Resumo executivo (3-4 frases)
`;

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
            content: 'Você é um analista de inteligência de mercado B2B, especialista em análise de presença digital e identificação de oportunidades para vendas de ERP TOTVS. Seja objetivo, preciso e focado em insights acionáveis.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) throw new Error('Erro na API OpenAI');

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse da resposta da IA
    return {
      strengths: extractSection(aiResponse, 'pontos fortes|strengths|vantagens'),
      weaknesses: extractSection(aiResponse, 'pontos fracos|weaknesses|problemas'),
      insights: {
        businessModel: extractLine(aiResponse, 'modelo de negócio|business model'),
        targetAudience: extractLine(aiResponse, 'público-alvo|target audience'),
        keyProducts: extractArray(aiResponse, 'produtos|products|serviços|services'),
        marketPosition: extractLine(aiResponse, 'posição no mercado|market position'),
        opportunities: extractArray(aiResponse, 'oportunidades|opportunities'),
        threats: extractArray(aiResponse, 'ameaças|threats|riscos|risks'),
      },
      executiveSummary: aiResponse.split('\n').slice(0, 4).join(' '),
    };
  } catch (error) {
    console.error('[AI] ❌ Análise IA falhou:', error);
    return {
      strengths: ['Presença digital detectada'],
      weaknesses: ['Análise IA indisponível'],
      insights: {
        businessModel: 'Não identificado',
        targetAudience: 'Não identificado',
        keyProducts: [],
        marketPosition: 'Não identificado',
        opportunities: [],
        threats: [],
      },
      executiveSummary: 'Análise completa indisponível. Verifique conectividade com OpenAI.',
    };
  }
}

/**
 * 💡 GERA RECOMENDAÇÕES GOOGLE (baseado em compliance)
 */
function generateGoogleRecommendations(health: any): string[] {
  const recommendations: string[] = [];

  if (health.googleCompliance < 50) {
    recommendations.push('🚨 CRÍTICO: Website NÃO está em compliance com Google!');
    recommendations.push('📋 Adicionar meta tags (title, description, keywords)');
    recommendations.push('🏗️ Implementar Schema.org (structured data)');
  }

  if (health.hasErrors) {
    recommendations.push('🐛 Corrigir erros técnicos no website (403, 404, 500)');
    recommendations.push('🔧 Revisar configuração do servidor');
  }

  if (health.googleCompliance >= 50 && health.googleCompliance < 80) {
    recommendations.push('⚠️ Melhorias necessárias para compliance 100%');
    recommendations.push('📱 Otimizar para mobile (Core Web Vitals)');
    recommendations.push('⚡ Melhorar velocidade de carregamento');
  }

  if (health.googleCompliance >= 80) {
    recommendations.push('✅ Website em boa compliance com Google!');
    recommendations.push('💡 Considere AI Mode optimization (intenção de busca)');
  }

  return recommendations;
}

// Helpers para extrair informações da resposta da IA
function extractSection(text: string, pattern: string): string[] {
  const regex = new RegExp(`(${pattern})[:\\-]?\\s*([^\\n]+)`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.slice(0, 3).map(m => m.trim()) : [];
}

function extractLine(text: string, pattern: string): string {
  const regex = new RegExp(`(${pattern})[:\\-]?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[2].trim() : 'Não identificado';
}

function extractArray(text: string, pattern: string): string[] {
  const regex = new RegExp(`(${pattern})[:\\-]?\\s*([^\\n]+)`, 'gi');
  const matches = text.match(regex);
  if (!matches) return [];
  
  return matches
    .map(m => m.split(/[,;]/).map(item => item.trim()))
    .flat()
    .filter(item => item.length > 5)
    .slice(0, 5);
}

