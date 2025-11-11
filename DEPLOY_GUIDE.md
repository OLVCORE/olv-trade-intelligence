# 🚀 OLV TRADE INTELLIGENCE - GUIA DE DEPLOY

## 📋 PRÉ-REQUISITOS

- ✅ Conta no Supabase (https://supabase.com/)
- ✅ Conta no Vercel (https://vercel.com/)
- ✅ Conta no Apollo.io (para Dealer Discovery)
- ✅ Conta no Resend/SendGrid (para emails)
- ✅ Node.js 18+ e npm instalado

---

## 1️⃣ SETUP SUPABASE

### 1.1. Criar Projeto Supabase

1. Acesse https://app.supabase.com/
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** olv-trade-intelligence
   - **Database Password:** (anote em local seguro)
   - **Region:** South America (São Paulo)
4. Aguarde 2-3 minutos até o projeto ser provisionado

### 1.2. Executar Migrations (3 arquivos)

No dashboard do Supabase, vá em **SQL Editor** e execute os 3 arquivos na ordem:

#### **Migration 1: Multi-Tenant Setup**

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20251111000000_multi_tenant_setup.sql

-- Execute TUDO (criar tabelas, RLS, MetaLife tenant, workspaces)
```

#### **Migration 2: Tenant Branding**

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20251111000002_tenant_branding.sql

-- Adiciona logo_url, cores, contatos, bucket tenant-logos
```

#### **Migration 3: Commercial Proposals**

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20251111000001_commercial_proposals.sql

-- Cria tabela commercial_proposals e função para número de proposta
```

### 1.3. Verificar Tabelas Criadas

No dashboard, vá em **Table Editor** e confirme que existem:

- ✅ `tenants` (MetaLife já inserido)
- ✅ `workspaces` (3 workspaces do MetaLife)
- ✅ `tenant_products`
- ✅ `trade_data`
- ✅ `hs_codes`
- ✅ `companies` (com tenant_id, workspace_id)
- ✅ `commercial_proposals`
- ✅ Buckets Storage: `tenant-logos`, `proposal-pdfs`

---

## 2️⃣ ASSOCIAR USUÁRIO AO TENANT

### 2.1. Criar Primeiro Usuário

1. No Supabase, vá em **Authentication > Users**
2. Clique **"Add User"**
3. Preencha:
   - **Email:** seu-email@empresa.com
   - **Password:** (senha forte)
   - **Confirm Password:** (mesma senha)
4. Clique **"Create User"**

### 2.2. Associar ao Tenant MetaLife

No **SQL Editor**, execute:

```sql
-- Buscar ID do tenant MetaLife
SELECT id, name FROM public.tenants WHERE slug = 'metalife';

-- Copie o UUID retornado e execute:
UPDATE public.users
SET tenant_id = '<UUID_DO_METALIFE_AQUI>'
WHERE email = 'seu-email@empresa.com';

-- Verificar:
SELECT 
  u.email, 
  t.name AS tenant,
  t.primary_color
FROM public.users u
JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'seu-email@empresa.com';
```

---

## 3️⃣ DEPLOY EDGE FUNCTIONS

### 3.1. Instalar Supabase CLI

```bash
# Windows (PowerShell como Admin)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS/Linux
brew install supabase/tap/supabase

# Verificar instalação
supabase --version
```

### 3.2. Login no Supabase

```bash
# Login
supabase login

# Link projeto
cd C:\Projects\olv-trade-intelligence
supabase link --project-ref <SEU_PROJECT_REF>
```

**Onde encontrar PROJECT_REF:**
- Dashboard Supabase > Settings > General > Project ID

### 3.3. Deploy das 3 Edge Functions

```bash
# 1. Discover Dealers B2B
supabase functions deploy discover-dealers-b2b

# 2. Import Product Catalog (se implementada)
supabase functions deploy import-product-catalog

# 3. Generate Commercial Proposal
supabase functions deploy generate-commercial-proposal

# Verificar deployment
supabase functions list
```

---

## 4️⃣ CONFIGURAR ENVIRONMENT VARIABLES

### 4.1. Supabase Edge Functions Secrets

```bash
# Apollo.io API Key
supabase secrets set APOLLO_API_KEY=<sua-api-key-aqui>

# Resend API Key (emails)
supabase secrets set RESEND_API_KEY=<sua-resend-api-key>

# Exchange Rate API (opcional - tem plano free)
supabase secrets set EXCHANGE_RATE_API_KEY=<sua-exchange-rate-api-key>

# Freightos API (opcional - estimativas de frete)
supabase secrets set FREIGHTOS_API_KEY=<sua-freightos-api-key>

# Verificar secrets
supabase secrets list
```

### 4.2. Frontend Environment Variables (Vercel)

Crie arquivo `.env.local` com:

```env
# Supabase
VITE_SUPABASE_URL=https://<seu-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>

# Edge Functions URLs
VITE_DISCOVER_DEALERS_URL=https://<seu-project-ref>.supabase.co/functions/v1/discover-dealers-b2b
VITE_GENERATE_PROPOSAL_URL=https://<seu-project-ref>.supabase.co/functions/v1/generate-commercial-proposal

# Apollo.io (para frontend também)
VITE_APOLLO_API_KEY=<sua-apollo-api-key>
```

**Onde encontrar:**
- `VITE_SUPABASE_URL`: Dashboard > Settings > API > Project URL
- `VITE_SUPABASE_ANON_KEY`: Dashboard > Settings > API > Project API keys > anon/public

---

## 5️⃣ BUILD & DEPLOY NO VERCEL

### 5.1. Instalar Vercel CLI

```bash
npm install -g vercel

# Login
vercel login
```

### 5.2. Build Local (testar)

```bash
cd C:\Projects\olv-trade-intelligence

# Instalar dependências
npm install

# Build
npm run build

# Preview local (opcional)
npm run preview
```

### 5.3. Deploy no Vercel

```bash
# Deploy de produção
vercel --prod

# Durante deploy, responda:
# ? Set up and deploy? Yes
# ? Which scope? (sua conta)
# ? Link to existing project? No
# ? What's your project's name? olv-trade-intelligence
# ? In which directory is your code located? ./
# ? Want to modify these settings? No
```

### 5.4. Configurar Environment Variables no Vercel

1. Acesse https://vercel.com/dashboard
2. Selecione projeto **olv-trade-intelligence**
3. Vá em **Settings > Environment Variables**
4. Adicione as mesmas variáveis do `.env.local`:

| KEY | VALUE | ENVIRONMENT |
|-----|-------|------------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `<anon-key>` | Production |
| `VITE_DISCOVER_DEALERS_URL` | `https://<project-ref>.supabase.co/functions/v1/discover-dealers-b2b` | Production |
| `VITE_GENERATE_PROPOSAL_URL` | `https://<project-ref>.supabase.co/functions/v1/generate-commercial-proposal` | Production |
| `VITE_APOLLO_API_KEY` | `<apollo-key>` | Production |

5. Clique **"Save"** e faça **Redeploy** do projeto

---

## 6️⃣ CHECKLIST DE TESTES

### ✅ 6.1. Autenticação

- [ ] Acessar https://olv-trade-intelligence.vercel.app/
- [ ] Fazer login com o usuário criado
- [ ] Verificar se workspace "Prospecção Brasil" aparece no WorkspaceSwitcher
- [ ] Verificar se logo/iniciais do tenant aparecem no header

### ✅ 6.2. Tenant Branding

- [ ] Ir para `/tenant-settings`
- [ ] Aba **"Branding"** carrega corretamente
- [ ] Fazer upload de logo (PNG, máx 2MB)
- [ ] Alterar cores (primária e secundária)
- [ ] Salvar dados de contato (email, telefone, endereço)
- [ ] Verificar preview das propostas

### ✅ 6.3. Catálogo de Produtos

- [ ] Ir para `/catalog`
- [ ] Criar produto manualmente:
   - Nome: `Cadillac Pilates Reformer`
   - HS Code: `9506.91.00`
   - Preço FOB: `USD 2,500`
   - MOQ: `5 units`
   - Peso: `150 kg`
   - Volume: `2.5 m³`
- [ ] Salvar e verificar na lista

### ✅ 6.4. Export Dealers Discovery

- [ ] Ir para `/export-dealers`
- [ ] Preencher formulário:
   - HS Code: `9506.91.00`
   - País: `United States`
   - Volume mínimo: `USD 100,000`
- [ ] Clicar **"Buscar Dealers B2B"**
- [ ] Verificar resultados (Apollo.io)
- [ ] Conferir filtros B2B/B2C aplicados

### ✅ 6.5. Propostas Comerciais

- [ ] No card de um dealer, clicar **"Gerar Proposta"**
- [ ] Selecionar produtos do catálogo
- [ ] Preencher calculadora de pricing:
   - Valor total: `USD 12,500`
   - Peso: `750 kg`
   - Volume: `12.5 m³`
   - Modal: `Ocean`
   - Porto destino: `USNYC` (New York)
   - Incentivos: `REINTEGRA` ativado
- [ ] Verificar 11 Incoterms calculados
- [ ] Gerar PDF preview
- [ ] Verificar logo e branding do tenant no PDF
- [ ] Enviar email (se RESEND_API_KEY configurado)

### ✅ 6.6. Histórico de Propostas

- [ ] Ir para `/proposals`
- [ ] Verificar proposta gerada aparece na lista
- [ ] Status: `draft` ou `sent`
- [ ] Baixar PDF gerado
- [ ] Verificar logo, cores e contatos do tenant no PDF

---

## 7️⃣ PRIMEIRO ACESSO (Passo a Passo)

### Para novo tenant (ex: Empresa X):

#### 1. **Admin cria tenant no banco**

```sql
INSERT INTO public.tenants (name, slug, cnpj, website, industry, primary_color, secondary_color)
VALUES (
  'Empresa X',
  'empresa-x',
  '12.345.678/0001-99',
  'https://empresax.com.br',
  'Industrial Equipment',
  '#0052CC',
  '#00B8D9'
);

-- Buscar ID
SELECT id FROM public.tenants WHERE slug = 'empresa-x';
```

#### 2. **Criar workspaces para Empresa X**

```sql
INSERT INTO public.workspaces (tenant_id, name, type, target_countries, is_active)
VALUES 
  ('<TENANT_ID_EMPRESA_X>', 'Prospecção Brasil', 'domestic', ARRAY['BR'], true),
  ('<TENANT_ID_EMPRESA_X>', 'Export - USA', 'export', ARRAY['US'], true),
  ('<TENANT_ID_EMPRESA_X>', 'Import - China', 'import', ARRAY['CN'], true);
```

#### 3. **Criar usuário e associar**

```sql
-- No Supabase: Authentication > Add User
-- Email: usuario@empresax.com.br
-- Password: (senha forte)

-- Depois:
UPDATE public.users 
SET tenant_id = '<TENANT_ID_EMPRESA_X>'
WHERE email = 'usuario@empresax.com.br';
```

#### 4. **Usuário configura branding**

- Fazer login em https://olv-trade-intelligence.vercel.app/
- Ir para `/tenant-settings`
- Fazer upload do logo da Empresa X
- Configurar cores corporativas
- Preencher dados de contato

#### 5. **Importar catálogo de produtos**

- Ir para `/catalog`
- Clicar **"Importar do Site"** (se Edge Function implementada)
- OU adicionar produtos manualmente

#### 6. **Começar prospecção!**

- Descobrir dealers em `/export-dealers`
- Gerar propostas comerciais
- Acompanhar histórico em `/proposals`

---

## 8️⃣ TROUBLESHOOTING

### ❌ **"Tenant não identificado"**

**Causa:** Usuário não está associado a nenhum tenant

**Solução:**
```sql
UPDATE public.users 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'metalife')
WHERE email = 'seu-email@empresa.com';
```

### ❌ **"Error calling Edge Function"**

**Causa:** Environment variables não configuradas

**Solução:**
1. Verificar secrets: `supabase secrets list`
2. Adicionar missing key: `supabase secrets set KEY_NAME=value`
3. Redeploy função: `supabase functions deploy <function-name>`

### ❌ **"Logo não aparece"**

**Causa:** Storage bucket não público ou policy incorreta

**Solução:**
```sql
-- Tornar bucket público
UPDATE storage.buckets
SET public = true
WHERE id = 'tenant-logos';

-- Verificar policies
SELECT * FROM storage.policies WHERE bucket_id = 'tenant-logos';
```

### ❌ **"Email não enviado"**

**Causa:** RESEND_API_KEY não configurado

**Solução:**
1. Obter API Key em https://resend.com/api-keys
2. Configurar: `supabase secrets set RESEND_API_KEY=re_xxx`
3. Verificar domínio verificado no Resend (ou usar `onboarding@resend.dev` para testes)

---

## 9️⃣ MONITORAMENTO

### Supabase Logs

- **Edge Functions:** Dashboard > Edge Functions > (função) > Logs
- **Database:** Dashboard > Database > Logs
- **Authentication:** Dashboard > Authentication > Logs

### Vercel Logs

- Dashboard > Project > Logs
- Filtrar por status code (4xx, 5xx)

### Métricas Importantes

- Taxa de conversão: Dealers descobertos → Propostas geradas
- Taxa de envio: Propostas criadas → Emails enviados
- Upload de produtos: Catálogo crescendo?
- Usuários por tenant: Multi-tenant funcionando?

---

## 🎯 PRÓXIMOS PASSOS

- [ ] Configurar custom domain no Vercel (ex: trade.olv.com.br)
- [ ] Implementar webhook do Resend para tracking de emails
- [ ] Conectar API real de shipping (Freightos, ShipEngine)
- [ ] Implementar crawler de produtos (Edge Function)
- [ ] Adicionar analytics (PostHog, Mixpanel)
- [ ] White-label completo: remover "STRATEVO Intelligence"
- [ ] Mobile app (React Native ou PWA)

---

## 📞 SUPORTE

**Documentação:**
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Apollo.io: https://apolloio.github.io/apollo-api-docs/

**Contato:**
- Email: dev@olv.com.br
- GitHub Issues: [repositório do projeto]

---

✅ **Deploy completo!** Plataforma 100% funcional e pronta para produção!

