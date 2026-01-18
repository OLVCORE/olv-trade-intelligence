# 🔧 INSTRUÇÕES PARA APLICAR MIGRAÇÃO: saved_dealer_searches

## ❌ Erro Atual
O erro `404` ao salvar busca indica que a tabela `saved_dealer_searches` **NÃO EXISTE** no banco de dados.

## ✅ Solução

### Opção 1: Via Supabase Dashboard (Recomendado)
1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/20260118000004_create_saved_dealer_searches.sql`
4. Clique em **Run** ou **Execute**

### Opção 2: Via Supabase CLI (Local)
Se estiver usando Supabase local:
```bash
psql -h localhost -U postgres -d postgres -f supabase/migrations/20260118000004_create_saved_dealer_searches.sql
```

### Opção 3: Aplicar via código (temporário)
A migração já está corrigida no código. Após aplicar manualmente no banco, o sistema funcionará normalmente.

## ⚠️ Importante
- Esta migração é **IDEMPOTENTE** (pode ser executada múltiplas vezes sem erro)
- Ela cria a tabela `saved_dealer_searches` com todas as políticas RLS
- Após aplicar, o botão "Salvar Busca" funcionará corretamente

## 📋 Verificação
Após aplicar, verifique se a tabela existe:
```sql
SELECT * FROM saved_dealer_searches LIMIT 1;
```

Se retornar sem erro, a migração foi aplicada com sucesso!
