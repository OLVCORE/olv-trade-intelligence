# SCRIPT: Buscar Dealers em Múltiplos Países
# Usa a função multi-source-dealer-discovery

$apiUrl = "https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/multi-source-dealer-discovery"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYWxzb3B3ZmtyeGlheHhvcGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzAxMzYsImV4cCI6MjA3ODQwNjEzNn0.chAVNaYFfgFm0PPWydVIMh1oWGuBTx0Pz6WdLEHvuNA"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$countries = @("United States", "Canada", "Mexico", "United Kingdom", "Germany", "France", "Spain", "Chile", "Australia")

$allDealers = @()
$totalCredits = 0

foreach ($country in $countries) {
    Write-Host "`n🌍 Buscando: $country..." -ForegroundColor Cyan
    
    try {
        $body = @{
            country = $country
            mode = "full"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $body -TimeoutSec 120
        
        Write-Host "✅ $country: $($response.total) dealers" -ForegroundColor Green
        Write-Host "   Tier A: $($response.stats.tier_A)" -ForegroundColor Yellow
        Write-Host "   Créditos: $($response.stats.credits_apollo)" -ForegroundColor Gray
        
        $allDealers += $response.dealers
        $totalCredits += $response.stats.credits_apollo
        
        # Salvar resultado individual
        $filename = "dealers_$($country.Replace(' ', '_')).json"
        $response | ConvertTo-Json -Depth 10 | Out-File $filename
        
    } catch {
        Write-Host "❌ Erro em $country : $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 5
}

Write-Host "`n`n📊 RESUMO GERAL:" -ForegroundColor Green
Write-Host "Total Dealers: $($allDealers.Count)"
Write-Host "Total Créditos Apollo: $totalCredits"
Write-Host "Custo estimado: USD $([math]::Round($totalCredits * 0.10, 2))"

# Salvar resultado consolidado
$allDealers | ConvertTo-Json -Depth 10 | Out-File "dealers_ALL_COUNTRIES.json"
Write-Host "`n✅ Salvo em: dealers_ALL_COUNTRIES.json" -ForegroundColor Green

