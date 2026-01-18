# 📦 Instruções de Deploy - Edge Functions

## Scripts Disponíveis

### 1. `deploy-enrich-apollo.ps1`
Script específico para fazer deploy da função `enrich-apollo-decisores`.

**Uso:**
```powershell
.\deploy-enrich-apollo.ps1
```

### 2. `deploy-edge-function.ps1`
Script genérico para fazer deploy de qualquer Edge Function.

**Uso:**
```powershell
.\deploy-edge-function.ps1 -FunctionName "nome-da-funcao"
```

**Exemplos:**
```powershell
# Deploy da função enrich-apollo-decisores
.\deploy-edge-function.ps1 -FunctionName "enrich-apollo-decisores"

# Deploy da função batch-enrich-360
.\deploy-edge-function.ps1 -FunctionName "batch-enrich-360"

# Deploy da função extract-company-info-from-url
.\deploy-edge-function.ps1 -FunctionName "extract-company-info-from-url"
```

## Pré-requisitos

1. **Supabase CLI instalado**
   ```powershell
   # Verificar se está instalado
   supabase --version
   
   # Se não estiver, instale via:
   # https://supabase.com/docs/guides/cli
   ```

2. **Autenticado no Supabase**
   ```powershell
   supabase login
   ```

3. **Projeto vinculado (se necessário)**
   ```powershell
   supabase link --project-ref seu-project-ref
   ```

## Executando o Deploy

### Opção 1: Script Específico (Recomendado)
```powershell
# Execute na raiz do projeto
.\deploy-enrich-apollo.ps1
```

### Opção 2: Script Genérico
```powershell
.\deploy-edge-function.ps1 -FunctionName "enrich-apollo-decisores"
```

### Opção 3: Manual (via Supabase CLI)
```powershell
cd supabase\functions\enrich-apollo-decisores
supabase functions deploy enrich-apollo-decisores
```

## O que o Script Faz

1. ✅ Verifica se o arquivo da função existe
2. ✅ Verifica se o Supabase CLI está instalado
3. ✅ Verifica autenticação (opcional)
4. ✅ Faz o deploy da função
5. ✅ Exibe mensagens de sucesso/erro
6. ✅ Fornece soluções para erros comuns

## Troubleshooting

### Erro: "Supabase CLI não encontrado"
**Solução:** Instale o Supabase CLI:
- Windows: `scoop install supabase` ou baixe de https://github.com/supabase/cli/releases

### Erro: "not authenticated"
**Solução:** Execute `supabase login`

### Erro: "project not found" ou "not linked"
**Solução:** Execute `supabase link` para vincular ao projeto

### Erro: "Permission denied"
**Solução:** Execute o PowerShell como Administrador ou ajuste as políticas de execução:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Verificação Pós-Deploy

Após o deploy, você pode verificar:

1. **No Supabase Dashboard:**
   - Acesse: Edge Functions → `enrich-apollo-decisores`
   - Verifique se a função está ativa

2. **Testando no Frontend:**
   - Tente enriquecer uma empresa via Apollo
   - Verifique os logs no console do navegador

3. **Logs da Função:**
   - No Supabase Dashboard → Edge Functions → Logs
   - Verifique se há erros ou avisos

## Notas Importantes

- ⚠️ O deploy substitui a versão anterior da função
- ⚠️ Certifique-se de que as alterações foram testadas localmente
- ⚠️ Verifique os logs após o deploy para garantir que está funcionando
- ✅ O script mantém o diretório atual após a execução
