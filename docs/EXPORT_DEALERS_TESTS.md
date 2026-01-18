# 🧪 TESTES OBRIGATÓRIOS — EXPORT DEALERS (B2B)

**Data de Criação:** 2026-01-18  
**Última Atualização:** 2026-01-18  
**Status:** ✅ CHECKLIST DE VALIDAÇÃO

---

## 🎯 OBJETIVO

Validar que o sistema bloqueia corretamente:
- Marketplaces (Falabella, CompuMarket, Alibaba, etc.)
- E-commerce (domínios + padrões de URL + sinais de texto)
- Data sources/Directories (ImportGenius, Panjiva, ImportKey, Tradebase, sitemaps)
- B2C (studios, gyms, wellness centers)
- Uso final inválido (termos excluídos)
- Países fora da seleção

E que o sistema retorna apenas:
- Empresas B2B reais (distribuidores, importadores, dealers)
- Com uso final válido (termos incluídos)
- Com keywords obrigatórias
- Dos países selecionados

---

## ✅ CHECKLIST DE TESTES

Antes de cada teste:
- [ ] Limpar resultados anteriores (se necessário)
- [ ] Verificar console do navegador (sem erros)
- [ ] Verificar logs da Edge Function (Supabase Dashboard)

Após cada teste:
- [ ] Verificar que não há marketplaces nos resultados
- [ ] Verificar que não há datasources nos resultados
- [ ] Verificar que resultados contêm keywords
- [ ] Verificar que resultados contêm uso final
- [ ] Verificar que países exibidos estão na seleção (PT)
- [ ] Verificar que scraping não sobrescreveu país incorretamente

---

## 🧪 CENÁRIO 1 — PILATES (HS 950691, Países ES)

### Inputs:
- **HS Code:** `950691` (equipamentos de exercício físico)
- **Keywords:** `pilates reformer`, `cadillac`, `tower`, `chair`
- **Uso Final INCLUIR:** `equipamento pilates`, `pilates studio`, `estudio pilates profissional`
- **Uso Final EXCLUIR:** `home gym`, `dumbbell`, `uso doméstico`, `hobby`
- **Países:** `España`, `Chile`, `Colombia`, `México`
- **Min Volume:** Opcional

### Resultado Esperado:
- ✅ Apenas dealers/distribuidores de equipamentos de Pilates profissional
- ✅ Empresas que mencionam "pilates studio", "equipamento pilates", "reformer", "cadillac"
- ✅ Empresas B2B (distributor, importer, wholesaler)
- ✅ Países: Espanha, Chile, Colômbia, México (exibidos em português)

### Bloqueios Esperados:
- 🚫 Falabella, CompuMarket, MercadoLibre (marketplaces)
- 🚫 ImportGenius, Panjiva, ImportKey, Tradebase (datasources)
- 🚫 URLs com `/product`, `/products`, `/shop`, `/store` (e-commerce)
- 🚫 Texto contendo "buy now", "add to cart", "price", "shipping" (e-commerce)
- 🚫 Texto contendo "shipment data", "customs records", "sitemap" (datasources)
- 🚫 "home gym", "dumbbell", "uso doméstico" (uso final excluído)
- 🚫 Fitness studios, gyms, personal trainers (B2C)
- 🚫 Países fora da seleção (ex: Estados Unidos, Índia, Bélgica)

### Validação Manual:
1. Executar busca com os parâmetros acima
2. Verificar console: `[FILTER]` logs mostrando bloqueios
3. Verificar resultados: Nenhum marketplace ou datasource
4. Verificar países: Apenas Espanha, Chile, Colômbia, México
5. Verificar uso final: Apenas empresas que mencionam "pilates studio" ou "equipamento pilates"
6. Verificar scraping: País não foi sobrescrito incorretamente

### Exemplos de URLs a BLOQUEAR:
- `https://www.falabella.com/falabella-cl/product/...`
- `https://www.compumarket.com.py/tienda/...`
- `https://www.importgenius.com/importers/...`
- `https://www.panjiva.com/companies/...`
- `https://www.mercadolibre.com/...`
- `https://example.com/sitemap.xml`
- `https://example.com/product/pilates-reformer`

### Exemplos de URLs a ACEITAR:
- `https://www.equipamentospilates.com` (distribuidor)
- `https://www.pilatesdistributors.cl` (dealer Chile)
- `https://www.mayoristapilates.es` (mayorista Espanha)

---

## 🧪 CENÁRIO 2 — AVIAÇÃO (HS Cap. 88 + Uso "Aerospace Manufacturing")

### Inputs:
- **HS Code:** `880330` (hélices e suas partes), ou capítulo 88 completo
- **Keywords:** `aerospace component`, `aviation equipment`, `aircraft parts`
- **Uso Final INCLUIR:** `aerospace manufacturing`, `aviation industry`, `aircraft production`
- **Uso Final EXCLUIR:** `hobby drone`, `drone hobby`, `model aircraft`, `retail aviation`
- **Países:** `United States`, `Germany`, `France`, `United Kingdom`

### Resultado Esperado:
- ✅ Apenas distribuidores/importadores de componentes aeronáuticos
- ✅ Empresas que mencionam "aerospace manufacturing", "aviation industry"
- ✅ Empresas B2B (distributor, importer, supplier)
- ✅ Países: Estados Unidos, Alemanha, França, Reino Unido

### Bloqueios Esperados:
- 🚫 Hobby drones, model aircraft (uso final excluído)
- 🚫 Retail aviation stores (B2C)
- 🚫 Marketplaces (Amazon, eBay, etc.)
- 🚫 Data sources (ImportGenius, Panjiva, etc.)
- 🚫 E-commerce (URLs com `/product`, `/shop`)

### Validação Manual:
1. Executar busca
2. Verificar: Nenhum hobby drone ou retail aviation
3. Verificar: Apenas B2B aerospace/aviation
4. Verificar países: Apenas selecionados

---

## 🧪 CENÁRIO 3 — CONSTRUÇÃO CIVIL (Uso "Structural Construction / Infrastructure")

### Inputs:
- **HS Code:** `842951` (máquinas de construção), ou capítulo 84/87
- **Keywords:** `construction equipment`, `construction machinery`, `excavator`, `crane`
- **Uso Final INCLUIR:** `structural construction`, `infrastructure`, `construction project`, `civil engineering`
- **Uso Final EXCLUIR:** `DIY`, `home improvement`, `home depot`, `do it yourself`
- **Países:** `Brasil`, `Argentina`, `Chile`, `Colombia`

### Resultado Esperado:
- ✅ Apenas distribuidores de equipamentos de construção civil
- ✅ Empresas que mencionam "construction project", "infrastructure", "civil engineering"
- ✅ Empresas B2B (distributor, importer, dealer)
- ✅ Países: Brasil, Argentina, Chile, Colômbia

### Bloqueios Esperados:
- 🚫 DIY stores, home improvement (uso final excluído)
- 🚫 Home Depot, Leroy Merlin (e-commerce/retail)
- 🚫 Marketplaces e datasources
- 🚫 URLs com `/product`, `/shop`

### Validação Manual:
1. Executar busca
2. Verificar: Nenhum DIY ou home improvement
3. Verificar: Apenas B2B construction/infrastructure
4. Verificar países: Apenas selecionados

---

## 🧪 CENÁRIO 4 — AGRO (Uso "Livestock Feed Additive / Feed Mill / Aquaculture")

### Inputs:
- **HS Code:** `230990` (rações para animais), `310100` (fertilizantes)
- **Keywords:** `feed additive`, `feed mill`, `aquaculture feed`, `livestock nutrition`
- **Uso Final INCLUIR:** `feed mill`, `aquaculture`, `livestock production`, `animal feed production`
- **Uso Final EXCLUIR:** `garden center`, `pet shop`, `retail pet food`, `home garden`
- **Países:** `Brasil`, `Argentina`, `Chile`, `Paraguai`

### Resultado Esperado:
- ✅ Apenas distribuidores/importadores de rações e aditivos para produção
- ✅ Empresas que mencionam "feed mill", "aquaculture", "livestock production"
- ✅ Empresas B2B (distributor, importer, supplier)
- ✅ Países: Brasil, Argentina, Chile, Paraguai

### Bloqueios Esperados:
- 🚫 Garden centers, pet shops (uso final excluído)
- 🚫 Retail pet food stores (B2C)
- 🚫 Marketplaces e datasources
- 🚫 URLs com `/product`, `/shop`

### Validação Manual:
1. Executar busca
2. Verificar: Nenhum garden center ou pet shop
3. Verificar: Apenas B2B feed mill/aquaculture
4. Verificar países: Apenas selecionados

---

## 📋 CHECKLIST FINAL DE VALIDAÇÃO

Após todos os testes:

- [ ] **Lint:** `npm run lint` — Sem erros
- [ ] **Build:** `npm run build` — Sem erros
- [ ] **Console:** Sem erros críticos no navegador
- [ ] **Edge Function Logs:** Verificar logs no Supabase Dashboard
- [ ] **Resultados:**
  - [ ] Zero marketplaces
  - [ ] Zero datasources/directories
  - [ ] Zero B2C (studios, gyms)
  - [ ] Zero uso final inválido
  - [ ] Zero países fora da seleção
  - [ ] Apenas empresas B2B válidas
  - [ ] Apenas países selecionados (exibidos em PT)
  - [ ] Apenas uso final válido
  - [ ] Apenas keywords obrigatórias presentes

---

## 🐛 TROUBLESHOOTING

### Erro: "Uso final obrigatório não fornecido"
**Solução:** Verificar que `usageContextInclude.length > 0` no formulário

### Erro: Marketplace aparecendo nos resultados
**Solução:** Verificar `BLOCKED_DOMAINS` em `marketplaceBlocklist.ts` e logs `[FILTER]`

### Erro: País incorreto após scraping
**Solução:** Verificar lógica de validação de país no `dealerToCompanyFlow.ts` (linha ~150)

### Erro: Data source aparecendo nos resultados
**Solução:** Verificar `BLOCKED_DATASOURCE_SIGNALS` em `marketplaceBlocklist.ts` e logs `[FILTER]`

### Erro: Fit Score sempre 0
**Solução:** Verificar logs `[FIT-SCORE]` e validação de uso final/keywords

---

**FIM DO DOCUMENTO DE TESTES**
