# 🔑 CONFIGURAR HUNTER.IO API KEY

## ✅ JÁ CONFIGURADO NO SUPABASE!

A chave já está nos **Edge Function Secrets** do Supabase:
```
HUNTER_API_KEY=02e8e5e7d9c20945f0243eeaab724f3f1fa72dab
```

---

## 📋 ADICIONAR NO .env.local (OPCIONAL - DESENVOLVIMENTO LOCAL)

**Crie ou edite o arquivo `.env.local` na raiz do projeto:**

```bash
# Hunter.io (Fallback para revelar emails - 100 grátis/mês)
HUNTER_API_KEY=02e8e5e7d9c20945f0243eeaab724f3f1fa72dab
```

---

## 🎯 COMO TESTAR:

1. **Recarregue:** `Ctrl + Shift + R`
2. **Vá na aba Inteligência**
3. **Role até "Decisores & Contatos Apollo"**
4. **Clique em "🔓 Revelar (1 crédito)"** em qualquer decisor
5. **Alert aparece:**
   - ⚠️ Consumo de 1 crédito Apollo
   - 🔄 Triple Fallback (Apollo → Hunter → Phantom)
   - 💡 Só paga se encontrar
6. **Confirme**
7. **Aguarde** 2-5 segundos
8. **Email revelado** aparece na UI!

---

## 🔄 TRIPLE FALLBACK:

1. ✅ **Apollo Reveal API** - Tenta revelar (1 crédito se sucesso)
2. ✅ **Hunter.io** - Busca gratuita por nome + domínio (JÁ CONFIGURADO!)
3. ⏳ **PhantomBuster** - Scraping LinkedIn (implementar depois)

---

## 📊 HUNTER.IO LIMITES:

- **Grátis:** 100 buscas/mês
- **Starter ($49/mês):** 500 buscas
- **Growth ($99/mês):** 2.500 buscas

**Teste agora!** 🚀

