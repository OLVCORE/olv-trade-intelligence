# 🧪 TESTE APOLLO MANUAL

## EXECUTE NO CONSOLE DO NAVEGADOR:

```javascript
// Testar Apollo diretamente
const { data, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
  body: { 
    company_id: 'e85f24e3-0502-4eea-af84-70e8da0900ae',
    company_name: 'PLASTICOS REGINA',
    domain: 'plasticosregina.com.br'
  }
});

console.log('✅ Resposta:', data);
console.log('❌ Erro:', error);
```

## O QUE DEVE RETORNAR:

```json
{
  "success": true,
  "decisores": [...],
  "statistics": {
    "total": 5,
    "decision_makers": 2,
    "influencers": 1,
    "users": 2
  }
}
```

## SE DER ERRO:

Me envie a mensagem completa do erro!

## DEPOIS, VERIFICAR NO BANCO:

```sql
SELECT COUNT(*) FROM decision_makers;
```

Deve ser > 0!

