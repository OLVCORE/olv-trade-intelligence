# 🚀 STRATEVO INTELLIGENCE - DOCUMENTAÇÃO COMPLETA DA PLATAFORMA

**Versão:** 2.0  
**Data:** Novembro 2025  
**Objetivo:** Documentação técnica e funcional de todos os módulos da plataforma

---

## 📋 ÍNDICE

1. [Visão Geral da Plataforma](#visão-geral)
2. [Arquitetura e Stack Técnico](#arquitetura)
3. [Fluxo de Trabalho Completo](#fluxo)
4. [Módulo COMANDO](#comando)
5. [Módulo PROSPECÇÃO (ICP - Coração da Plataforma)](#prospecção)
6. [Módulo EXECUÇÃO](#execução)
7. [Módulo ESTRATÉGIA](#estratégia)
8. [Módulo MÉTRICAS](#métricas)
9. [Módulo GOVERNANÇA](#governança)
10. [Integrações e APIs](#integrações)
11. [Estrutura de Dados](#dados)

---

## 🎯 1. VISÃO GERAL DA PLATAFORMA {#visão-geral}

### **O QUE É A STRATEVO INTELLIGENCE?**

A Stratevo Intelligence é uma **plataforma completa de inteligência de vendas** que automatiza e enriquece o processo de prospecção B2B, desde a descoberta de empresas até a execução de vendas.

### **PROBLEMA QUE RESOLVE:**

❌ **ANTES:**
- Vendedores perdem tempo pesquisando empresas manualmente
- Análise de ICP (Ideal Customer Profile) é subjetiva e inconsistente
- Falta de dados ricos sobre prospects (decisores, tecnologias, competitors)
- Desperdício de esforço em empresas com baixo potencial
- Impossibilidade de analisar centenas/milhares de empresas simultaneamente

✅ **DEPOIS (Com Stratevo):**
- **Descoberta automatizada** de empresas via CNPJ, razão social, domínio
- **Análise ICP completa** em 9 dimensões (Keywords, TOTVS, Competitors, Similar, Clients, Decisores, 360°, Products, Executive)
- **Enriquecimento de dados** (Receita Federal, BrasilAPI, Apollo, Hunter.io, PhantomBuster)
- **Priorização inteligente** (ICP Score, Digital Maturity, Tech Sophistication)
- **Análise em massa** de até 1000 empresas simultaneamente
- **Pipeline qualificado** com empresas de alto potencial

---

### **JORNADA DO USUÁRIO:**

```
┌────────────────────────────────────────────────────────────────────┐
│  JORNADA COMPLETA - DO LEAD FRIO AO CLIENTE FECHADO               │
└────────────────────────────────────────────────────────────────────┘

1️⃣ DESCOBERTA (Comando)
   ↓
   Busca global por empresas (CNPJ, nome, domínio)
   
2️⃣ TRIAGEM (Prospecção - ICP)
   ↓
   Análise ICP completa (9 abas de relatório)
   Classificação: GO / NO-GO / REVISAR
   
3️⃣ QUARENTENA (Prospecção - ICP)
   ↓
   Empresas com potencial ficam em "Quarentena"
   Enriquecimento contínuo (decisores, concorrentes, clientes)
   
4️⃣ PIPELINE (Execução - SDR Sales Suite)
   ↓
   Empresas qualificadas vão para o pipeline Kanban
   Status: Lead → Qualificação → Proposta → Negociação → Fechado
   
5️⃣ ESTRATÉGIA (Estratégia - ROI-Labs)
   ↓
   Playbooks de vendas personalizados
   Battle cards contra concorrentes
   Simulador de ROI
   
6️⃣ MÉTRICAS (Métricas)
   ↓
   Acompanhamento de metas, conversões, performance SDR
```

---

### **PÚBLICO-ALVO:**

- **SDRs (Sales Development Representatives):** Prospecção e qualificação
- **Account Executives (AEs):** Fechamento de vendas
- **Gestores de Vendas:** Estratégia e métricas
- **C-Level:** Decisões estratégicas e ROI

---

## 🏗️ 2. ARQUITETURA E STACK TÉCNICO {#arquitetura}

### **STACK TECNOLÓGICO:**

**Frontend:**
- React 18 (TypeScript)
- Vite (build tool)
- TailwindCSS (styling)
- Shadcn UI (componentes)
- @tanstack/react-query (gerenciamento de estado)
- React Router (navegação)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Supabase Edge Functions (serverless)
- Row Level Security (RLS) para segurança

**Deploy:**
- Vercel (frontend)
- Supabase Cloud (backend)

**Integrações (APIs):**
- **Serper API:** Google Search (descoberta de websites)
- **OpenAI (GPT-4o-mini):** Análise de inteligência, insights, recomendações
- **Jina AI:** Web scraping e extração de conteúdo
- **BrasilAPI:** Dados de CNPJ, CNAE, NCM
- **Hunter.io:** Verificação de emails
- **Apollo.io:** Enriquecimento B2B
- **PhantomBuster:** Scraping LinkedIn
- **Wave7:** Descoberta de clientes de concorrentes

### **ESTRUTURA DE PASTAS:**

```
src/
├── components/
│   ├── common/          # Componentes reutilizáveis (FloatingNavigation, etc)
│   ├── icp/             # Componentes de análise ICP
│   │   └── tabs/        # 9 abas do relatório ICP
│   ├── totvs/           # Detecção TOTVS
│   ├── sales/           # Pipeline e CRM
│   └── dashboard/       # Dashboard executivo
├── hooks/               # React hooks customizados
├── lib/                 # Utilitários
├── pages/               # Páginas da aplicação
├── services/            # Lógica de negócio e chamadas de API
├── types/               # Tipos TypeScript
└── supabase/
    └── functions/       # Edge Functions (backend serverless)
```

---

## 🔄 3. FLUXO DE TRABALHO COMPLETO {#fluxo}

### **EXEMPLO PRÁTICO: EMPRESA "CASAS PEDRO"**

```
┌────────────────────────────────────────────────────────────────────┐
│  PASSO A PASSO REAL                                                │
└────────────────────────────────────────────────────────────────────┘

📍 PASSO 1: DESCOBERTA
   ↓
   Usuário acessa "Prospecção > Descoberta de Empresas"
   Insere CNPJ: 42.591.651/0001-43
   Sistema busca na Receita Federal → Razão Social: "Nova Geração Comestíveis S.A. (Casas Pedro)"
   
📍 PASSO 2: ANÁLISE INDIVIDUAL
   ↓
   Usuário clica em "Análise Individual"
   Sistema carrega dados básicos (CNPJ, endereço, capital social, CNAE)
   
📍 PASSO 3: RELATÓRIO ICP (9 ABAS)
   ↓
   
   🔹 ABA 1: KEYWORDS & SEO
      - Descoberta automática do website oficial (casaspedro.com.br)
      - Extração de 50 keywords ranqueadas
      - Análise de presença digital (Facebook, Instagram, LinkedIn)
      - Busca de empresas similares (mesmo CNAE/setor)
      - Insights de IA (modelo de negócio, público-alvo, oportunidades)
   
   🔹 ABA 2: TOTVS DETECTION
      - Busca evidências de uso do TOTVS (triple/double/single match)
      - Decisão: GO (não é cliente) / NO-GO (já é cliente) / REVISAR
      - Fontes: Website, LinkedIn, vagas de emprego, notícias
   
   🔹 ABA 3: COMPETITORS
      - Identifica ERPs concorrentes (SAP, Oracle, Senior, etc)
      - Battle cards para deslocamento
      - Pontos de dor vs. benefícios TOTVS
   
   🔹 ABA 4: SIMILAR COMPANIES
      - Lista empresas similares (mesmo CNAE, porte, região)
      - ICP Score de cada similar
      - Oportunidade de venda em rede
   
   🔹 ABA 5: CLIENTS (Wave7)
      - Descobre clientes da Casas Pedro
      - Identifica quais já são clientes TOTVS (para evitar duplicação)
      - Expansão em rede (vender para clientes dos clientes)
   
   🔹 ABA 6: DECISORES
      - Lista decisores (CEO, CFO, CIO, Diretor de TI)
      - Emails verificados (Hunter.io)
      - LinkedIn profiles (PhantomBuster)
   
   🔹 ABA 7: 360° ANALYSIS
      - Digital Health Score (0-100)
      - Digital Maturity Score (0-100)
      - Tech Sophistication Score (0-100)
      - Overall Health Score (média ponderada)
   
   🔹 ABA 8: RECOMMENDED PRODUCTS
      - Produtos TOTVS recomendados via IA
      - Stack sugerido (core, complementar, futuro)
      - ROI estimado por produto
   
   🔹 ABA 9: EXECUTIVE SUMMARY
      - Resumo executivo final
      - Decisão: GO / NO-GO / REVISAR
      - Recomendações de ação
      - Probabilidade de conversão

📍 PASSO 4: SALVAMENTO EM QUARENTENA
   ↓
   Se a empresa for classificada como "GO" (alto potencial):
   - Sistema salva na tabela `icp_analysis_results`
   - Status: "pendente" (em quarentena)
   - Usuário pode acessar via "Empresas em Quarentena"
   
📍 PASSO 5: MOVIMENTAÇÃO PARA PIPELINE
   ↓
   Usuário acessa "Empresas em Quarentena"
   Clica em "Adicionar ao Pipeline"
   Empresa vai para "SDR Sales Suite" (módulo Execução)
   Status inicial: "Lead"
   
📍 PASSO 6: EXECUÇÃO DE VENDAS
   ↓
   SDR trabalha a empresa no pipeline Kanban:
   Lead → Qualificação → Proposta → Negociação → Fechado/Perdido
   
📍 PASSO 7: MÉTRICAS E ESTRATÉGIA
   ↓
   Gestor acompanha métricas:
   - Taxa de conversão por etapa
   - Tempo médio de ciclo de venda
   - Performance de cada SDR
   - ROI da plataforma
```

---

## 🎛️ 4. MÓDULO COMANDO {#comando}

### **4.1. DASHBOARD EXECUTIVO**

**Localização:** Página inicial após login

**Objetivo:** Visão panorâmica de toda a operação de vendas

**Funcionalidades:**
- **KPIs Principais:**
  - Total de empresas em quarentena
  - Total de empresas no pipeline
  - Taxa de conversão geral
  - Receita prevista
  - Créditos restantes

- **Cards Interativos:**
  - Empresas recentemente analisadas
  - Análises TOTVS recentes (GO/NO-GO)
  - Empresas próximas ao fechamento
  - Alertas e notificações

- **Gráficos:**
  - Funil de conversão (ICP → Quarentena → Pipeline → Fechado)
  - Evolução de análises por dia/semana/mês
  - Performance de SDRs

**Tecnologia:**
- Componente: `src/pages/Dashboard.tsx`
- Hooks: `useDashboardStats`, `useRecentAnalyses`
- Queries Supabase: agregação de dados de múltiplas tabelas

---

### **4.2. BUSCA GLOBAL**

**Localização:** Barra superior (disponível em todas as páginas)

**Objetivo:** Busca rápida por empresas, contatos, relatórios

**Funcionalidades:**
- Busca por CNPJ
- Busca por razão social
- Busca por domínio
- Busca por nome de contato (decisor)
- Autocompletar (typeahead)

**Tecnologia:**
- Componente: `src/components/common/GlobalSearch.tsx`
- API: Full-text search do PostgreSQL (tsvector)

---

## 🔍 5. MÓDULO PROSPECÇÃO (ICP - CORAÇÃO DA PLATAFORMA) {#prospecção}

### **CONTEXTO:**

Este é o **módulo mais importante** da Stratevo. É aqui que acontece a **magia**: transformar dados brutos (CNPJ) em inteligência acionável.

**POR QUE É O CORAÇÃO?**
- Define quais empresas valem a pena prospectar
- Economiza tempo dos SDRs (foco apenas em leads qualificados)
- Aumenta taxa de conversão (só empresas com alto ICP Score vão pro pipeline)
- Enriquece dados (de 5 campos básicos para 50+ campos enriquecidos)

---

### **5.1. CENTRAL ICP HOME**

**Localização:** `Prospecção > ICP > Central ICP Home`

**Objetivo:** Hub central de acesso a todas as funcionalidades de ICP

**Funcionalidades:**
- Dashboard de estatísticas ICP
- Acesso rápido a Descoberta, Análise Individual, Análise em Massa
- Últimas análises realizadas
- Status de créditos (Serper, OpenAI, etc)

---

### **5.2. DESCOBERTA DE EMPRESAS**

**Localização:** `Prospecção > ICP > Descoberta de Empresas`

**Objetivo:** Encontrar empresas para analisar

**Funcionalidades:**

**MÉTODO 1: Busca por CNPJ**
- Usuário insere CNPJ (14 dígitos)
- Sistema consulta BrasilAPI → Receita Federal
- Retorna: Razão Social, Nome Fantasia, Endereço, CNAE, Capital Social, Data de Abertura, Status

**MÉTODO 2: Busca por Razão Social**
- Usuário digita nome da empresa
- Sistema faz busca fuzzy no banco + BrasilAPI
- Retorna lista de empresas correspondentes

**MÉTODO 3: Busca por Domínio**
- Usuário insere domínio (ex: casaspedro.com.br)
- Sistema busca empresa associada ao domínio

**MÉTODO 4: Importação em Massa (CSV/Excel)**
- Upload de arquivo com lista de CNPJs
- Sistema processa em batch

**Tecnologia:**
- Componente: `src/pages/CompanyDiscovery.tsx`
- API: BrasilAPI (`/cnpj/v1/{cnpj}`)
- Edge Function: `search-companies`

---

### **5.3. ANÁLISE INDIVIDUAL**

**Localização:** `Prospecção > ICP > Análise Individual`

**Objetivo:** Análise profunda de uma única empresa (relatório de 9 abas)

**ESTRUTURA DO RELATÓRIO ICP (9 ABAS):**

---

#### **ABA 1: KEYWORDS & SEO INTELLIGENCE** 🎯

**Arquivo:** `src/components/icp/tabs/KeywordsSEOTabEnhanced.tsx`

**Objetivo:** Descobrir presença digital, palavras-chave e empresas similares

**Funcionalidades:**

1. **Descoberta de Website Oficial:**
   - Botão: "🚀 Descobrir Website & Presença Digital Completa"
   - Usa Serper API para buscar "website oficial [Razão Social]"
   - Retorna TOP 20 resultados ranqueados por confiança (0-100%)
   - Algoritmo de ranking:
     - Penaliza redes sociais (-80%)
     - Penaliza agregadores de dados (-70%)
     - Bonifica `.com.br`, `.ind.br`, `.net.br` (+40 pontos)
     - Bonifica match exato do nome da empresa no domínio (+60 pontos)
   - #1 resultado é selecionado automaticamente
   - Outros 19 resultados ficam visíveis em dropdown scrollable

2. **Análise SEO Completa:**
   - Extrai 50 keywords do website via Jina AI
   - Calcula relevance score (0-100) para cada keyword
   - Exibe em tabela 4 colunas com badges coloridas (verde/amarelo/laranja/vermelho)
   - Identifica categoria principal (produto/serviço)

3. **Presença Digital (8 ferramentas em paralelo):**
   - Facebook (URL + posts recentes)
   - Instagram (URL + posts recentes)
   - LinkedIn (URL + posts recentes)
   - Twitter (URL + posts recentes)
   - YouTube (URL + vídeos recentes)
   - WhatsApp Business (número)
   - Email corporativo (contato@empresa.com.br)
   - Telefone corporativo

4. **Análise de IA (GPT-4o-mini):**
   - Resumo executivo da empresa
   - Modelo de negócio identificado
   - Público-alvo principal
   - Oportunidades de venda TOTVS
   - Digital Maturity Assessment

5. **Empresas Similares:**
   - Busca empresas do mesmo CNAE/NCM
   - Filtra por porte, região, faturamento
   - TOP 10 empresas similares
   - Cada resultado com botão "Adicionar à Quarentena" e "Visitar"

6. **Google Compliance (Collapsible):**
   - Meta tags (title, description)
   - Schema.org markup
   - Mobile-friendliness
   - Page speed
   - HTTPS

**Tecnologia:**
- Serper API (Google Search)
- Jina AI (Web scraping)
- OpenAI GPT-4o-mini (Insights)
- BrasilAPI (CNAE/NCM)

**Edge Functions:**
- `search-official-website`
- `analyze-seo`
- `discover-digital-presence`
- `find-similar-companies`

**Estado Local:**
```typescript
const [discoveredDomain, setDiscoveredDomain] = useState<string>('');
const [allWebsiteResults, setAllWebsiteResults] = useState<WebsiteSearchResult[]>([]);
const [seoData, setSeoData] = useState<SEOData | null>(null);
const [digitalPresence, setDigitalPresence] = useState<DigitalPresence | null>(null);
const [intelligenceReport, setIntelligenceReport] = useState<IntelligenceReport | null>(null);
const [similarCompaniesOptions, setSimilarCompaniesOptions] = useState<SimilarCompany[]>([]);
```

**Salvamento:**
```typescript
onDataChange?.({
  seoData,
  digitalPresence,
  intelligenceReport,
  discoveredDomain,
  allWebsiteResults,
  similarCompaniesOptions,
  lastSaved: new Date().toISOString(),
});
```

---

#### **ABA 2: TOTVS DETECTION** 🔎

**Arquivo:** `src/components/icp/tabs/TOTVSDetectionTab.tsx`

**Objetivo:** Detectar se a empresa JÁ É cliente TOTVS (para evitar prospectar clientes existentes)

**Funcionalidades:**

1. **Botão de Verificação:**
   - "Verificar se é Cliente TOTVS"
   - Executa 12 verificações em paralelo

2. **Metodologia de Detecção (Triple/Double/Single Match):**

   **TRIPLE MATCH (Alta Confiança - 95%):**
   - 3+ evidências de diferentes fontes
   - Ex: LinkedIn menciona "ERP TOTVS" + vaga de emprego pede "conhecimento TOTVS" + notícia cita "implantação TOTVS"
   - Resultado: **NO-GO** (já é cliente, descartar)

   **DOUBLE MATCH (Média Confiança - 75%):**
   - 2 evidências de fontes diferentes
   - Ex: Website menciona "integração TOTVS" + LinkedIn mostra colaboradores ex-TOTVS
   - Resultado: **REVISAR** (provável cliente, validar manualmente)

   **SINGLE MATCH (Baixa Confiança - 40%):**
   - 1 evidência isolada
   - Ex: Apenas 1 vaga de emprego menciona TOTVS
   - Resultado: **REVISAR** (pode ser apenas interesse, não cliente)

   **NO MATCH (Sem Evidências):**
   - Nenhuma evidência encontrada
   - Resultado: **GO** (não é cliente, pode prospectar!)

3. **Fontes de Verificação (12 pontos):**
   - ✅ Website oficial (scraping de texto)
   - ✅ LinkedIn empresa (posts, about, tecnologias listadas)
   - ✅ Vagas de emprego (Indeed, LinkedIn Jobs, Catho)
   - ✅ Notícias (Google News)
   - ✅ Notas fiscais eletrônicas (menção a TOTVS em XML público)
   - ✅ Contatos no LinkedIn (colaboradores com "TOTVS" no perfil)
   - ✅ Tecnologias detectadas (BuiltWith, Wappalyzer)
   - ✅ Domínios de email (padrão @totvs.com.br em contatos)
   - ✅ Eventos/webinars (presença em eventos TOTVS)
   - ✅ Cases de sucesso (menção em site do TOTVS)
   - ✅ Integrações mencionadas (APIs, webhooks)
   - ✅ Certificações (empresa parceira TOTVS)

4. **Decisão Final:**
   - Algoritmo pondera evidências
   - Badge visual: 🟢 GO / 🔴 NO-GO / 🟡 REVISAR
   - Lista de evidências encontradas (com fonte e timestamp)

**Tecnologia:**
- Serper API (Google Search, News)
- Jina AI (Scraping)
- LinkedIn Scraping (PhantomBuster)
- Edge Function: `detect-totvs-client`

**Estado Local:**
```typescript
const [totvsStatus, setTotvsStatus] = useState<'GO' | 'NO-GO' | 'REVISAR' | null>(null);
const [evidences, setEvidences] = useState<Evidence[]>([]);
const [confidenceScore, setConfidenceScore] = useState<number>(0);
```

---

#### **ABA 3: COMPETITORS** ⚔️

**Arquivo:** `src/components/icp/tabs/CompetitorsTab.tsx`

**Objetivo:** Identificar quais ERPs/sistemas concorrentes a empresa está usando

**Funcionalidades:**

1. **Detecção de Concorrentes:**
   - Lista de ERPs monitorados: SAP, Oracle, Microsoft Dynamics, Senior, Sankhya, Protheus (outro distribuidor TOTVS), Datasul, Logix, RM, etc.
   - Mesma metodologia de detecção do TOTVS (triple/double/single match)

2. **Battle Cards Automáticos:**
   - Para cada concorrente detectado, gera battle card:
     - **Pontos Fortes do Concorrente**
     - **Pontos Fracos do Concorrente**
     - **Vantagens do TOTVS**
     - **Roteiro de Deslocamento** (script de vendas)

3. **Oportunidade de Migração:**
   - Calcula score de "facilidade de migração" (0-100)
   - Fatores: custo do concorrente, insatisfação (Reclame Aqui), tempo de contrato

**Tecnologia:**
- Serper API
- OpenAI (geração de battle cards)
- Edge Function: `detect-competitors`

---

#### **ABA 4: SIMILAR COMPANIES** 🏢

**Arquivo:** `src/components/icp/tabs/SimilarCompaniesTab.tsx`

**Objetivo:** Encontrar empresas similares para venda em rede

**Funcionalidades:**

1. **Critérios de Similaridade:**
   - Mesmo CNAE (atividade econômica)
   - Mesmo NCM (produtos/serviços)
   - Porte similar (capital social, nº de funcionários)
   - Região similar (mesmo estado ou região metropolitana)

2. **ICP Score de Similaridade:**
   - Algoritmo calcula score (0-100) para cada empresa similar
   - Quanto maior, mais "parecida" com a empresa analisada

3. **Ações:**
   - "Adicionar à Quarentena" (todas de uma vez ou individualmente)
   - "Análise Individual" (abre relatório ICP da empresa similar)

**Tecnologia:**
- BrasilAPI (CNAE, NCM)
- Supabase queries (busca em banco de empresas)
- Edge Function: `find-similar-companies`

---

#### **ABA 5: CLIENTS (WAVE7)** 🌊

**Arquivo:** `src/components/icp/tabs/ClientsTab.tsx`

**Objetivo:** Descobrir clientes da empresa analisada (para venda em rede)

**Funcionalidades:**

1. **Descoberta de Clientes (Wave7 Integration):**
   - Usa Wave7 API para encontrar empresas que compraram da empresa analisada
   - Níveis de relacionamento:
     - **Nível 1:** Clientes diretos (compram regularmente)
     - **Nível 2:** Clientes ocasionais
     - **Nível 3:** Ex-clientes (não compram há 1+ anos)

2. **Filtro Automático de Clientes TOTVS:**
   - Para cada cliente encontrado, verifica se já é cliente TOTVS
   - Se já for, marca com badge 🔴 "Cliente TOTVS" (não prospectar)
   - Se não for, marca com badge 🟢 "Oportunidade" (adicionar à quarentena)

3. **Expansão em Rede:**
   - Estratégia: "Se a empresa X usa TOTVS, seus clientes também podem usar"
   - Permite adicionar múltiplos clientes à quarentena de uma vez

**Tecnologia:**
- Wave7 API
- Edge Function: `discover-clients`

---

#### **ABA 6: DECISORES** 👔

**Arquivo:** `src/components/icp/tabs/DecisoresTab.tsx`

**Objetivo:** Encontrar decisores (C-Level) para contato direto

**Funcionalidades:**

1. **Busca de Decisores:**
   - Cargos-alvo: CEO, CFO, CIO, CTO, Diretor de TI, Gerente de TI, Diretor Financeiro
   - Fontes:
     - LinkedIn (PhantomBuster scraping)
     - Website (página "Equipe" / "Sobre")
     - Hunter.io (email finder)

2. **Dados Coletados:**
   - Nome completo
   - Cargo
   - LinkedIn profile URL
   - Email corporativo (verificado pelo Hunter.io)
   - Telefone (se disponível)

3. **Verificação de Email:**
   - Hunter.io valida se email existe (SMTP check)
   - Score de confiança (0-100%)
   - Status: ✅ Válido / ⚠️ Risco / ❌ Inválido

4. **Exportação:**
   - CSV com todos os decisores
   - Integração direta com CRM (futuro)

**Tecnologia:**
- PhantomBuster (LinkedIn scraping)
- Hunter.io (Email finder & verification)
- Apollo.io (Enriquecimento B2B)
- Edge Functions: `find-decisores`, `verify-emails`

---

#### **ABA 7: 360° ANALYSIS** 📊

**Arquivo:** `src/components/icp/tabs/Analysis360Tab.tsx`

**Objetivo:** Análise holística da empresa (scores consolidados)

**Funcionalidades:**

1. **Digital Health Score (0-100):**
   - Avalia "saúde digital" da empresa
   - Fatores:
     - Website ativo e funcional (+30)
     - Presença em 3+ redes sociais (+25)
     - Posts recentes (últimos 30 dias) (+20)
     - SSL/HTTPS (+10)
     - Mobile-friendly (+10)
     - Schema.org markup (+5)

2. **Digital Maturity Score (0-100):**
   - Avalia "maturidade digital" (quão avançada tecnologicamente)
   - Fatores:
     - E-commerce implementado (+30)
     - APIs públicas documentadas (+20)
     - Integração com ERPs detectada (+20)
     - Marketing automation (HubSpot, RD Station) (+15)
     - CRM implementado (+10)
     - BI/Analytics (Power BI, Tableau) (+5)

3. **Tech Sophistication Score (0-100):**
   - Avalia "sofisticação tecnológica"
   - Fatores:
     - Cloud computing (AWS, Azure, GCP) (+30)
     - Inteligência Artificial/ML (+25)
     - Microservices architecture (+20)
     - DevOps/CI-CD (+15)
     - Kubernetes/Docker (+10)

4. **Overall Health Score (média ponderada):**
   - Fórmula: (Digital Health * 0.4) + (Digital Maturity * 0.35) + (Tech Sophistication * 0.25)
   - Score final (0-100) determina prioridade de prospecção

5. **Visualizações:**
   - Gráfico radar (spider chart) com os 3 scores
   - Comparação com média do setor
   - Recomendações de produtos TOTVS baseadas nos scores

**Tecnologia:**
- Consolidação de dados das abas anteriores
- Algoritmo proprietário de scoring
- Edge Function: `calculate-360-score`

---

#### **ABA 8: RECOMMENDED PRODUCTS** 🛒

**Arquivo:** `src/components/icp/tabs/RecommendedProductsTab.tsx`

**Objetivo:** Recomendar produtos TOTVS via IA

**Funcionalidades:**

1. **Análise de Necessidades (IA):**
   - GPT-4o-mini analisa todos os dados coletados (keywords, CNAE, digital maturity, competitors)
   - Identifica "dores" da empresa

2. **Recomendação de Stack TOTVS:**

   **PRODUTOS CORE (Essenciais):**
   - ERP TOTVS Protheus / RM / Datasul (baseado no porte)
   - Módulos: Financeiro, Contábil, Fiscal

   **PRODUTOS COMPLEMENTARES:**
   - TOTVS Fluig (BPM/ECM)
   - TOTVS CRM
   - TOTVS BI
   - TOTVS RH

   **PRODUTOS FUTUROS (Expansão):**
   - TOTVS Carol (IA)
   - TOTVS Colaboração (Teams-like)
   - TOTVS Assinatura Eletrônica

3. **ROI Estimado:**
   - Para cada produto, calcula ROI aproximado
   - Fatores: custo médio, economia esperada, tempo de payback

4. **Priorização:**
   - Quick Wins (alto impacto, baixo esforço)
   - Strategic Initiatives (alto impacto, alto esforço)
   - Fill-ins (baixo impacto, baixo esforço)

**Tecnologia:**
- OpenAI GPT-4o-mini
- Base de conhecimento de produtos TOTVS (embeddings)
- Edge Function: `recommend-products`

---

#### **ABA 9: EXECUTIVE SUMMARY** 📋

**Arquivo:** `src/components/icp/tabs/ExecutiveSummaryTab.tsx`

**Objetivo:** Resumo executivo consolidado (para gestores)

**Funcionalidades:**

1. **Decisão Final:**
   - 🟢 **GO:** Prospectar (alta probabilidade de conversão)
   - 🔴 **NO-GO:** Descartar (já é cliente TOTVS ou baixo potencial)
   - 🟡 **REVISAR:** Validação manual necessária

2. **Resumo de Todas as Abas:**
   - Keywords principais (TOP 5)
   - Status TOTVS (GO/NO-GO)
   - Concorrentes detectados
   - Empresas similares encontradas
   - Decisores identificados
   - Scores 360°
   - Produtos recomendados

3. **Probabilidade de Conversão:**
   - Algoritmo ML calcula probabilidade (0-100%)
   - Baseado em histórico de vendas (empresas similares que viraram clientes)

4. **Próximos Passos Recomendados:**
   - Sugestão automática de ações:
     - "Adicionar à Quarentena"
     - "Entrar em contato com [Decisor X]"
     - "Criar proposta com [Produto Y]"

5. **Exportação:**
   - Botão "Exportar PDF"
   - Gera relatório executivo completo (9 páginas)

**Tecnologia:**
- Consolidação de todas as abas
- Algoritmo de decisão (GO/NO-GO)
- jsPDF (geração de PDF)
- Edge Function: `generate-executive-summary`

---

### **5.4. ANÁLISE EM MASSA**

**Localização:** `Prospecção > ICP > Análise em Massa`

**Objetivo:** Analisar centenas/milhares de empresas simultaneamente

**Funcionalidades:**

1. **Upload de Lista (CSV/Excel):**
   - Colunas obrigatórias: CNPJ
   - Colunas opcionais: Razão Social, Domínio
   - Limite: 1000 empresas por batch

2. **Processamento em Background:**
   - Sistema cria fila de processamento
   - Executa análise ICP completa para cada empresa
   - Priorização: empresas com mais dados pré-existentes são processadas primeiro

3. **Análises Executadas:**
   - ABA 1 (Keywords) - ✅ Sempre
   - ABA 2 (TOTVS) - ✅ Sempre (crítico para GO/NO-GO)
   - ABA 3-9 - ⚠️ Opcional (consome mais créditos)

4. **Resultados:**
   - Tabela com todas as empresas analisadas
   - Colunas: Razão Social, CNPJ, Status TOTVS, ICP Score, Decisão (GO/NO-GO)
   - Filtros: Status, Score, Setor (CNAE)
   - Ações em massa: "Adicionar selecionadas à Quarentena"

5. **Otimização de Créditos:**
   - Cache de resultados (evita reprocessamento)
   - Análise parcial (se empresa já foi analisada há < 30 dias, usa cache)

**Tecnologia:**
- Supabase Edge Functions (processamento assíncrono)
- PostgreSQL (fila de jobs)
- Worker threads (paralelização)

---

### **5.5. EMPRESAS EM QUARENTENA** 📦

**Localização:** `Prospecção > ICP > Empresas em Quarentena`

**Objetivo:** Repositório de empresas com alto potencial (aguardando ação)

**Funcionalidades:**

1. **Listagem:**
   - Todas as empresas classificadas como "GO" ficam aqui
   - Tabela com colunas:
     - Razão Social
     - CNPJ
     - ICP Score (0-100)
     - Digital Maturity
     - Data de Análise
     - Ações

2. **Filtros:**
   - Por score (ex: apenas empresas com ICP Score > 80)
   - Por setor (CNAE)
   - Por região
   - Por data de análise

3. **Ações Individuais:**
   - "Ver Relatório Completo" (abre 9 abas)
   - "Adicionar ao Pipeline" (move para SDR Sales Suite)
   - "Exportar PDF"
   - "Descartar" (move para "Empresas Descartadas")

4. **Ações em Massa:**
   - Selecionar múltiplas empresas
   - "Adicionar ao Pipeline" (todas de uma vez)
   - "Exportar CSV"

5. **Enriquecimento Contínuo:**
   - Sistema roda análises incrementais a cada 7 dias
   - Atualiza: decisores (novos contratados), posts em redes sociais, notícias
   - Notifica usuário se houver mudanças significativas (ex: troca de CIO)

**Tecnologia:**
- Tabela: `icp_analysis_results` (status = 'pendente')
- Cron job (Supabase): atualização semanal
- Edge Function: `enrich-quarantine`

---

### **5.6. EMPRESAS DESCARTADAS** 🗑️

**Localização:** `Prospecção > ICP > Empresas Descartadas`

**Objetivo:** Repositório de empresas classificadas como "NO-GO" ou descartadas manualmente

**Funcionalidades:**

1. **Listagem:**
   - Empresas descartadas (motivo: já cliente TOTVS, baixo ICP Score, etc)
   - Tabela com colunas:
     - Razão Social
     - CNPJ
     - Motivo do Descarte
     - Data do Descarte

2. **Motivos de Descarte Automático:**
   - "Cliente TOTVS Existente" (detectado na ABA 2)
   - "ICP Score < 30" (baixíssimo potencial)
   - "Empresa Inativa" (Receita Federal)
   - "Sem Presença Digital" (nenhum website/rede social)

3. **Recuperação:**
   - Botão "Reativar" (move de volta para Quarentena)
   - Útil para empresas que foram descartadas erroneamente

**Tecnologia:**
- Tabela: `icp_analysis_results` (status = 'descartado')

---

### **5.7. HISTÓRICO STC** 📜

**Localização:** `Prospecção > ICP > Histórico STC`

**Objetivo:** Histórico de todas as verificações TOTVS realizadas

**STC = "Sistema TOTVS Check"**

**Funcionalidades:**

1. **Listagem:**
   - Todas as verificações TOTVS (ABA 2) executadas
   - Tabela com colunas:
     - Empresa
     - Data da Verificação
     - Resultado (GO / NO-GO / REVISAR)
     - Nível de Confiança (%)
     - Evidências Encontradas

2. **Detalhes:**
   - Clique em uma linha → abre modal com todas as evidências
   - Útil para auditar decisões (por que empresa foi classificada como NO-GO?)

3. **Estatísticas:**
   - Total de verificações realizadas
   - % GO vs. NO-GO vs. REVISAR
   - Tempo médio de verificação

**Tecnologia:**
- Tabela: `stc_verification_history`
- Edge Function: `get-stc-history`

---

### **5.8. DASHBOARD DE RESULTADOS** 📊

**Localização:** `Prospecção > ICP > Dashboard de Resultados`

**Objetivo:** Métricas e KPIs do módulo ICP

**Funcionalidades:**

1. **KPIs:**
   - Total de empresas analisadas (lifetime)
   - Empresas em Quarentena (aguardando ação)
   - Empresas no Pipeline (já em prospecção ativa)
   - Taxa de conversão (Quarentena → Pipeline → Fechado)

2. **Gráficos:**
   - Análises por dia/semana/mês
   - Distribuição de ICP Scores (histograma)
   - Setores (CNAE) mais analisados
   - Taxa de GO vs. NO-GO

3. **ROI do ICP:**
   - Custo total (créditos consumidos em APIs)
   - Receita gerada (empresas que viraram clientes)
   - ROI = (Receita - Custo) / Custo

---

### **5.9. AUDITORIA E COMPLIANCE** 🔒

**Localização:** `Prospecção > ICP > Auditoria e Compliance`

**Objetivo:** Logs e auditoria de ações (LGPD, compliance)

**Funcionalidades:**

1. **Logs de Ações:**
   - Quem analisou quais empresas
   - Quem adicionou/removeu empresas da Quarentena
   - Quem exportou relatórios

2. **LGPD Compliance:**
   - Consentimento de uso de dados
   - Botão "Solicitar Exclusão de Dados" (para empresas que pedirem)

---

### **5.10. INTELIGÊNCIA COMPETITIVA** 🎯

**Localização:** `Prospecção > ICP > Inteligência Competitiva`

**Objetivo:** Monitorar concorrentes do TOTVS (SAP, Oracle, etc)

**Funcionalidades:**

1. **Monitoramento de Concorrentes:**
   - Lista de clientes conhecidos de SAP, Oracle, Microsoft Dynamics
   - Notificações quando esses clientes aparecem em notícias (ex: "insatisfação com SAP")

2. **Oportunidades de Deslocamento:**
   - Empresas que usam concorrentes + têm sinais de insatisfação
   - Score de "facilidade de migração"

---

## 🚀 6. MÓDULO EXECUÇÃO {#execução}

### **6.1. SDR SALES SUITE** 💼

**Localização:** `Execução > SDR Sales Suite`

**Objetivo:** Pipeline Kanban para gerenciar oportunidades de vendas

**Funcionalidades:**

1. **Pipeline Kanban:**
   - Colunas (status):
     - 📥 **Lead:** Empresa acabou de sair da Quarentena
     - 📞 **Qualificação:** SDR está fazendo contato inicial
     - 💼 **Proposta:** AE enviou proposta comercial
     - 🤝 **Negociação:** Em negociação de valores/condições
     - ✅ **Fechado (Ganho):** Deal fechado!
     - ❌ **Fechado (Perdido):** Deal perdido (registrar motivo)

2. **Cards de Empresa:**
   - Cada card mostra:
     - Razão Social
     - ICP Score
     - Valor estimado do deal
     - SDR responsável
     - Dias no status atual
     - Ícone 📊 "Ver Relatório ICP"

3. **Arrastar e Soltar:**
   - Drag & drop entre colunas
   - Ao mover, registra:
     - Timestamp
     - Usuário responsável
     - Observações (modal)

4. **Filtros:**
   - Por SDR responsável
   - Por faixa de valor
   - Por tempo no pipeline

5. **Ações:**
   - "Ver Relatório ICP Completo" (abre 9 abas)
   - "Adicionar Nota"
   - "Agendar Follow-up"
   - "Enviar Email" (integração futura)

**Tecnologia:**
- Componente: `src/pages/SalesWorkspace.tsx`
- Biblioteca: `@dnd-kit/core` (drag and drop)
- Tabela: `pipeline_opportunities`

---

## 🎨 7. MÓDULO ESTRATÉGIA {#estratégia}

### **7.1. ROI-LABS** 💰

**Localização:** `Estratégia > ROI-Labs`

**Objetivo:** Simulador de ROI para propostas comerciais

**Funcionalidades:**

1. **Calculadora de ROI:**
   - Usuário insere:
     - Custo atual (ERP concorrente ou processos manuais)
     - Custo TOTVS (mensalidade + implantação)
     - Ganhos esperados (economia de tempo, redução de erros)
   - Sistema calcula:
     - ROI (%)
     - Payback (meses)
     - VPL (Valor Presente Líquido)

2. **Geração de Proposta Visual:**
   - Gráfico de economia ao longo do tempo
   - Exportação em PDF (para enviar ao cliente)

---

### **7.2. CANVAS (WAR ROOM)** 🗺️

**Localização:** `Estratégia > Canvas (War Room)`

**Objetivo:** Planejamento estratégico de contas (account planning)

**Funcionalidades:**

1. **Canvas Interativo:**
   - Drag & drop de insights, decisores, produtos recomendados
   - Mapa mental da conta

2. **Colaboração:**
   - Múltiplos SDRs/AEs podem editar simultaneamente
   - Comentários em tempo real

---

### **7.3. PLAYBOOKS DE VENDAS** 📖

**Localização:** `Estratégia > Playbooks de Vendas`

**Objetivo:** Scripts e melhores práticas de vendas

**Funcionalidades:**

1. **Biblioteca de Playbooks:**
   - Cold call scripts
   - Email templates
   - Objeções comuns + respostas

2. **Playbooks Personalizados (IA):**
   - Baseado no relatório ICP, gera script personalizado
   - Ex: "Como abordar empresa do setor alimentício que usa SAP"

---

### **7.4. BIBLIOTECA DE PERSONAS** 👥

**Localização:** `Estratégia > Biblioteca de Personas`

**Objetivo:** Repositório de ICPs e personas de compradores

**Funcionalidades:**

1. **Personas Padrão:**
   - CFO de indústria (50-500 funcionários)
   - CIO de varejo (500+ funcionários)
   - Diretor de TI de serviços

2. **Criação de Personas Customizadas:**
   - Baseado em análises ICP reais
   - Exportação para uso em marketing

---

## 📈 8. MÓDULO MÉTRICAS {#métricas}

### **8.1. METAS DE VENDAS** 🎯

**Localização:** `Métricas > Metas de Vendas`

**Objetivo:** Definir e acompanhar metas de vendas

**Funcionalidades:**

1. **Definição de Metas:**
   - Meta de receita (R$ por mês/trimestre/ano)
   - Meta de deals fechados (quantidade)
   - Meta de novas empresas na quarentena

2. **Acompanhamento:**
   - Progresso em tempo real
   - Projeção (baseado em ritmo atual)

---

### **8.2. ANALYTICS SDR** 📊

**Localização:** `Métricas > Analytics SDR`

**Objetivo:** Performance individual de SDRs

**Funcionalidades:**

1. **Métricas por SDR:**
   - Empresas analisadas
   - Empresas adicionadas à quarentena
   - Empresas movidas para pipeline
   - Deals fechados
   - Taxa de conversão (%)
   - Tempo médio de ciclo de venda

2. **Ranking:**
   - Leaderboard de SDRs

---

### **8.3. RELATÓRIOS EXECUTIVOS** 📄

**Localização:** `Métricas > Relatórios Executivos`

**Objetivo:** Relatórios consolidados para C-Level

**Funcionalidades:**

1. **Relatório Mensal:**
   - Resumo de atividades
   - ROI da plataforma
   - Pipeline health (previsão de receita)

2. **Exportação:**
   - PDF ou PowerPoint

---

## ⚙️ 9. MÓDULO GOVERNANÇA {#governança}

### **9.1. TRANSFORMAÇÃO DIGITAL** 🔄

**Localização:** `Governança > Transformação Digital`

**Objetivo:** Consultoria e acompanhamento de transformação digital dos clientes

---

### **9.2. MIGRAÇÃO DE DADOS** 📦

**Localização:** `Governança > Migração de Dados`

**Objetivo:** Ferramentas para migrar dados de ERPs concorrentes para TOTVS

---

### **9.3. CONSULTORIA OLV PREMIUM** 💎

**Localização:** `Governança > Consultoria OLV Premium`

**Objetivo:** Serviços premium de consultoria

---

### **9.4. CONFIGURAÇÕES** ⚙️

**Localização:** `Governança > Configurações`

**Objetivo:** Configurações da plataforma

**Funcionalidades:**

1. **Gestão de Créditos:**
   - Saldo atual de créditos (Serper, OpenAI, etc)
   - Histórico de consumo
   - Alertas de saldo baixo

2. **Integrações:**
   - Conectar APIs (Hunter.io, Apollo.io, etc)
   - Testar conexões

3. **Usuários e Permissões:**
   - Adicionar/remover SDRs
   - Definir permissões (admin, SDR, viewer)

4. **Temas:**
   - Light/Dark mode

---

## 🔗 10. INTEGRAÇÕES E APIS {#integrações}

### **INTEGRAÇÕES ATIVAS:**

1. **Serper API** (Google Search)
   - Uso: Descoberta de websites, notícias, vagas de emprego
   - Consumo: 1 crédito por query

2. **OpenAI (GPT-4o-mini)**
   - Uso: Análise de IA, insights, recomendações de produtos
   - Consumo: ~500 tokens por análise

3. **Jina AI**
   - Uso: Web scraping (extração de texto de websites)
   - Consumo: 1 crédito por URL

4. **BrasilAPI**
   - Uso: Dados de CNPJ, CNAE, NCM, CEP
   - Consumo: Gratuito

5. **Hunter.io**
   - Uso: Verificação de emails
   - Consumo: 1 crédito por email

6. **Apollo.io**
   - Uso: Enriquecimento B2B (dados de empresas e contatos)
   - Consumo: 1 crédito por empresa

7. **PhantomBuster**
   - Uso: Scraping LinkedIn (perfis, posts, conexões)
   - Consumo: 1 crédito por perfil

8. **Wave7**
   - Uso: Descoberta de clientes de clientes
   - Consumo: 10 créditos por empresa

---

## 📊 11. ESTRUTURA DE DADOS {#dados}

### **TABELAS PRINCIPAIS (Supabase PostgreSQL):**

```sql
-- Empresas base
companies (
  id UUID PRIMARY KEY,
  cnpj TEXT UNIQUE,
  razao_social TEXT,
  nome_fantasia TEXT,
  domain TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  cnae TEXT,
  capital_social DECIMAL,
  data_abertura DATE,
  status TEXT, -- 'ativa', 'inativa'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Análises ICP (relatório de 9 abas)
icp_analysis_results (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  icp_score INTEGER, -- 0-100
  totvs_status TEXT, -- 'GO', 'NO-GO', 'REVISAR'
  full_report JSONB, -- JSON com dados das 9 abas
  status TEXT, -- 'pendente' (quarentena), 'pipeline', 'descartado'
  analyzed_at TIMESTAMP,
  analyzed_by UUID REFERENCES users(id)
)

-- Histórico de verificações TOTVS
stc_verification_history (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  result TEXT, -- 'GO', 'NO-GO', 'REVISAR'
  confidence_score INTEGER, -- 0-100
  evidences JSONB, -- Array de evidências encontradas
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id)
)

-- Pipeline de vendas
pipeline_opportunities (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  icp_analysis_id UUID REFERENCES icp_analysis_results(id),
  status TEXT, -- 'lead', 'qualificacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'
  estimated_value DECIMAL,
  sdr_responsible UUID REFERENCES users(id),
  notes JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  closed_at TIMESTAMP
)

-- Decisores
decisores (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT,
  position TEXT,
  email TEXT,
  email_verified BOOLEAN,
  linkedin_url TEXT,
  phone TEXT,
  found_at TIMESTAMP
)

-- Usuários (SDRs, AEs, Gestores)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT, -- 'admin', 'sdr', 'ae', 'gestor', 'viewer'
  avatar_url TEXT,
  created_at TIMESTAMP
)
```

---

## 🎯 RESUMO EXECUTIVO FINAL

### **O QUE A STRATEVO FAZ:**

1. **DESCOBRE** empresas (CNPJ, domínio, razão social)
2. **ANALISA** profundamente (9 dimensões de ICP)
3. **QUALIFICA** automaticamente (GO/NO-GO/REVISAR)
4. **ENRIQUECE** com dados ricos (decisores, concorrentes, clientes)
5. **PRIORIZA** por score de potencial (0-100)
6. **EXECUTA** vendas via pipeline Kanban
7. **MEDE** resultados e ROI

### **POR QUE A STRATEVO É ÚNICA:**

- ✅ **Automatização end-to-end** (do lead frio ao cliente fechado)
- ✅ **IA integrada** (GPT-4o para insights)
- ✅ **Múltiplas fontes de dados** (8 APIs integradas)
- ✅ **Análise em massa** (até 1000 empresas simultaneamente)
- ✅ **Específico para TOTVS** (detecção de clientes existentes)

---

## 🚀 PRÓXIMOS PASSOS (Roadmap)

### **FASE 1: Finalizar Módulo ICP (ATUAL)**
- ✅ 9 abas do relatório
- ⏳ Salvamento persistente
- ⏳ Histórico de relatórios
- ⏳ Otimização de créditos

### **FASE 2: Módulo Execução**
- Pipeline Kanban (80% pronto)
- CRM integrado
- Email automation

### **FASE 3: Módulo Estratégia**
- ROI-Labs (simulador)
- Canvas (account planning)
- Playbooks automáticos (IA)

### **FASE 4: Módulo Métricas**
- Dashboard de gestão
- Analytics avançado
- Previsão de vendas (ML)

---

**FIM DA DOCUMENTAÇÃO COMPLETA**

🚀 **Stratevo Intelligence - Transformando Prospecção em Ciência**

