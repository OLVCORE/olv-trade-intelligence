# =====================================================
# DEPLOY DA EDGE FUNCTION: extract-company-info-from-url
# =====================================================

Write-Host "🚀 DEPLOY: extract-company-info-from-url" -ForegroundColor Cyan
Write-Host ""

# Verificar se Supabase CLI está instalado
Write-Host "1️⃣ Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI não encontrado" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "Ou via Scoop: scoop install supabase" -ForegroundColor Yellow
    exit 1
}

$version = supabase --version
Write-Host "✅ Supabase CLI encontrado: $version" -ForegroundColor Green
Write-Host ""

# Navegar para o diretório do projeto
Write-Host "2️⃣ Navegando para o diretório do projeto..." -ForegroundColor Yellow
$projectPath = "C:\Projects\olv-trade-intelligence"
Set-Location $projectPath
Write-Host "✅ Diretório: $projectPath" -ForegroundColor Green
Write-Host ""

# Verificar se está linkado ao projeto (opcional - pode pular se já estiver linkado)
Write-Host "3️⃣ Linkando ao projeto Supabase (se necessário)..." -ForegroundColor Yellow
$projectRef = "kdalsopwfkrxiaxxophh"
$linkResult = supabase link --project-ref $projectRef 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Aviso: Projeto pode já estar linkado ou erro ao linkar" -ForegroundColor Yellow
    Write-Host "Continuando com deploy..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Projeto linkado: $projectRef" -ForegroundColor Green
}
Write-Host ""

# Deploy da Edge Function
Write-Host "4️⃣ Fazendo deploy da Edge Function..." -ForegroundColor Yellow
Write-Host "Função: extract-company-info-from-url" -ForegroundColor Cyan
Write-Host ""

$deployResult = supabase functions deploy extract-company-info-from-url 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Aguarde 30-60 segundos para a função ficar disponível" -ForegroundColor White
    Write-Host "   2. Teste o enriquecimento internacional na aplicação" -ForegroundColor White
    Write-Host "   3. Verifique os logs no Supabase Dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Dashboard: https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ ERRO NO DEPLOY" -ForegroundColor Red
    Write-Host $deployResult
    Write-Host ""
    Write-Host "💡 Tentativas de solução:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se está logado: supabase login" -ForegroundColor White
    Write-Host "   2. Verifique se o projeto está linkado: supabase link --project-ref $projectRef" -ForegroundColor White
    Write-Host "   3. Verifique se a função existe em: supabase\functions\extract-company-info-from-url" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✨ PROCESSO CONCLUÍDO!" -ForegroundColor Green
