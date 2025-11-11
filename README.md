# 🌍 OLV Trade Intelligence

> **SaaS Multi-Tenant Platform for Export/Import Intelligence**

Plataforma profissional de inteligência de mercado B2B para empresas exportadoras e importadoras brasileiras. Descubra distribuidores internacionais, gere propostas comerciais automáticas com cálculo de Incoterms, e gerencie seu pipeline de exportação.

---

## 🎯 Para quem é este produto?

- 🏭 **Indústrias exportadoras** (Pilates, Fitness, Maquinário, etc.)
- 📦 **Trading companies**
- 🌎 **Empresas com ambição global**
- 💼 **Consultorias de comércio exterior**

---

## ✨ Features Principais

### 🏢 Multi-Tenant & White-Label

- ✅ Cada cliente tem seu próprio tenant (isolamento completo de dados)
- ✅ 3 workspaces por tenant: Domestic, Export, Import
- ✅ Logo, cores corporativas e contatos personalizados
- ✅ Branding aplicado em propostas PDF e emails

### 📦 Catálogo de Produtos Dinâmico

- ✅ Gerencie produtos com HS Code, MOQ, FOB, peso, volume
- ✅ Tooltips explicativos para iniciantes em comércio exterior
- ✅ Upload de imagens e especificações técnicas
- ✅ Integração com geração de propostas

### 🌍 Descoberta de Dealers B2B

- ✅ Busca em 195+ países
- ✅ Filtros B2B/B2C (55+ keywords de precisão)
- ✅ Integração com Apollo.io (50M+ empresas)
- ✅ Decision-makers específicos: Procurement, Import Manager, Purchasing Director
- ✅ Export Fit Score calculado automaticamente

### 💰 Motor de Pricing Robusto

- ✅ **11 Incoterms oficiais ICC 2020** (EXW, FOB, CIF, DDP, etc.)
- ✅ **4 modais de transporte:** Ocean, Air, Road, Rail
- ✅ **20+ rotas principais** (Brasil → USA, Europa, Ásia, LATAM)
- ✅ **5 incentivos fiscais brasileiros:**
  - ICMS (17%)
  - IPI (10%)
  - PIS/COFINS (9.25%)
  - Drawback (até 5%)
  - REINTEGRA (até 3%)
- ✅ Cálculo de frete por peso/volume exato (API Freightos + fallback)
- ✅ Conversão de moedas em tempo real (50+ moedas)

### 📄 Propostas Comerciais Profissionais

- ✅ Geração automática de PDF com logo e branding do cliente
- ✅ Multi-product selection do catálogo
- ✅ Todos os 11 Incoterms calculados e exibidos
- ✅ Email automático para o dealer (Resend/SendGrid)
- ✅ Histórico de propostas (draft, sent, accepted, rejected)
- ✅ Storage seguro no Supabase

---

## 🛠️ Tecnologias

### Frontend

- **React 18** + TypeScript
- **Vite** (build tool rápido)
- **Tailwind CSS** (styling)
- **Radix UI** (componentes acessíveis)
- **React Query** (data fetching & cache)
- **Lucide React** (ícones)

### Backend

- **Supabase** (BaaS)
  - PostgreSQL
  - Row Level Security (RLS)
  - Authentication
  - Storage (logos, PDFs)
  - Edge Functions (Deno)

### APIs Externas

- **Apollo.io** - Descoberta de dealers B2B
- **REST Countries** - Dados de 195+ países
- **Exchange Rate API** - Conversão de moedas
- **Resend/SendGrid** - Envio de emails
- **Freightos/ShipEngine** - Cotação de frete (preparado)

---

## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- API Keys: Apollo.io, Resend

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/olv-trade/olv-trade-intelligence.git
cd olv-trade-intelligence

# Instale dependências
npm install

# Configure .env.local
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute migrations no Supabase
# (siga DEPLOY_GUIDE.md seção 1.2)

# Inicie o servidor de desenvolvimento
npm run dev
```

### Deploy em Produção

Siga o guia completo em: **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)**

---

## 📁 Estrutura do Projeto

```
olv-trade-intelligence/
├── src/
│   ├── components/
│   │   ├── admin/              # ProductCatalogManager, TenantBrandingManager
│   │   ├── export/             # DealerCard, DealerDiscoveryForm
│   │   ├── proposals/          # CommercialProposalGenerator, PricingCalculator
│   │   └── layout/             # AppLayout, AppSidebar, WorkspaceSwitcher
│   ├── contexts/
│   │   └── TenantContext.tsx   # Estado global de tenant/workspace
│   ├── hooks/
│   │   ├── useCountries.ts     # 195+ países
│   │   ├── useCurrencyConverter.ts  # 50+ moedas
│   │   └── useSimpleProductCheck.ts
│   ├── lib/
│   │   ├── incotermsCalculator.ts   # 11 Incoterms ICC 2020
│   │   ├── shippingCalculator.ts    # 4 modais, 20+ rotas
│   │   └── exportIncentives.ts      # 5 incentivos fiscais BR
│   ├── data/
│   │   ├── countries.ts        # ISO codes, flags, regions
│   │   ├── currencies.ts       # Major currencies
│   │   └── incoterms.ts        # Descrições oficiais ICC
│   └── pages/
│       ├── ExportDealersPage.tsx
│       ├── ProductCatalogPage.tsx
│       ├── ProposalHistoryPage.tsx
│       └── TenantSettingsPage.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 20251111000000_multi_tenant_setup.sql
│   │   ├── 20251111000001_commercial_proposals.sql
│   │   └── 20251111000002_tenant_branding.sql
│   └── functions/
│       ├── discover-dealers-b2b/
│       └── generate-commercial-proposal/
├── DEPLOY_GUIDE.md             # Guia completo de deploy
├── FINAL_PROJECT_SUMMARY.md    # Sumário do projeto
└── README.md                   # Este arquivo
```

---

## 🎨 Screenshots

### Dashboard Multi-Tenant
![Dashboard](./docs/screenshots/dashboard.png)

### Descoberta de Dealers B2B
![Dealers](./docs/screenshots/export-dealers.png)

### Calculadora de Incoterms
![Pricing](./docs/screenshots/pricing-calculator.png)

### Proposta Comercial PDF
![Proposal](./docs/screenshots/commercial-proposal.png)

### Tenant Branding
![Branding](./docs/screenshots/tenant-branding.png)

---

## 📚 Documentação

- 📖 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Guia completo de setup e deploy
- 📊 [FINAL_PROJECT_SUMMARY.md](./FINAL_PROJECT_SUMMARY.md) - Sumário técnico do projeto
- 🎨 [TENANT_BRANDING_SYSTEM.md](./TENANT_BRANDING_SYSTEM.md) - Sistema de white-label
- ⚙️ [CRITICAL_CORRECTIONS_ROBUST_PRICING.md](./CRITICAL_CORRECTIONS_ROBUST_PRICING.md) - Especificações de pricing

---

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 🔐 Segurança

- ✅ **Row Level Security (RLS)** no Supabase (isolamento por tenant)
- ✅ **Authentication** via Supabase Auth
- ✅ **HTTPS** obrigatório (Vercel + Supabase)
- ✅ **Environment variables** para API keys
- ✅ **CORS** configurado nas Edge Functions
- ✅ **Input validation** em todos os formulários

---

## 📈 Roadmap

### Q1 2025

- [x] Multi-tenant & workspaces
- [x] Product catalog
- [x] Dealer discovery (B2B)
- [x] 11 Incoterms + 4 transport modes
- [x] Commercial proposals (PDF + email)
- [x] Tenant branding (white-label)

### Q2 2025

- [ ] Mobile app (React Native ou PWA)
- [ ] Dashboard com métricas de conversão
- [ ] Sistema de negociação (aceitar/rejeitar propostas)
- [ ] Integração CRM (HubSpot, Pipedrive)
- [ ] Import Intelligence (fornecedores internacionais)

### Q3 2025

- [ ] Marketplace (tenants negociando entre si)
- [ ] IA para recomendação de dealers
- [ ] Blockchain para rastreamento de cargas
- [ ] Documentação aduaneira automática (DU-E, DI)
- [ ] Assinatura SaaS (planos Starter/Pro/Enterprise)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

**Padrão de commits:** [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 Licença

Este projeto é proprietário da **OLV Trade Ltda**. Todos os direitos reservados.

Para licenciamento comercial, entre em contato: **comercial@olv.com.br**

---

## 👥 Time

- **Tech Lead:** [Seu Nome]
- **Product Owner:** [Nome]
- **Design:** [Nome]

---

## 📞 Suporte

- 📧 Email: suporte@olv.com.br
- 💬 Slack: [workspace]
- 🐛 Issues: [GitHub Issues](https://github.com/olv-trade/olv-trade-intelligence/issues)

---

## 🌟 Status do Projeto

![Status](https://img.shields.io/badge/status-production-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-proprietary-red)
![TypeScript](https://img.shields.io/badge/typescript-5.2-blue)
![React](https://img.shields.io/badge/react-18.2-blue)

---

**Desenvolvido com ❤️ por OLV Trade**

🌍 **De TOTVS para o mundo!**
