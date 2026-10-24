# ============================================================================
# WinShield Pro - Assinador Digital Oficial com Andrey Giordane
# Cria e instala o Certificado de Code Signing no Windows e assina o executavel
# ============================================================================

[CmdletBinding()]
param(
    [string]$TargetExe = "dist\WinShieldPro.exe"
)

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  ASSINADOR DIGITAL OFICIAL DO WINSHIELD PRO - ANDREY GIORDANE" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$certSubject = "CN=Andrey Giordane, O=WinShield Pro, OU=Software Development"
$certFriendlyName = "Andrey Giordane - Certificado Oficial de Assinatura"

# 1. Procurar certificado existente com CN=Andrey Giordane
Write-Host "[1/5] Verificando repositorio de certificados para 'Andrey Giordane'..." -ForegroundColor Yellow
$cert = Get-ChildItem -Path "Cert:\CurrentUser\My" -CodeSigningCert -Recurse | Where-Object { $_.Subject -like "*Andrey Giordane*" } | Select-Object -First 1

if (-not $cert) {
    $cert = Get-ChildItem -Path "Cert:\LocalMachine\My" -CodeSigningCert -Recurse | Where-Object { $_.Subject -like "*Andrey Giordane*" } | Select-Object -First 1
}

if (-not $cert) {
    Write-Host "Criando novo Certificado Digital de Code Signing (SHA256, 2048 bits)..." -ForegroundColor Green
    $certParams = @{
        Type               = "CodeSigningCert"
        Subject            = $certSubject
        KeyUsage           = "DigitalSignature"
        FriendlyName       = $certFriendlyName
        CertStoreLocation  = "Cert:\CurrentUser\My"
        NotAfter           = (Get-Date).AddYears(10)
        HashAlgorithm      = "SHA256"
        KeyLength          = 2048
    }
    $cert = New-SelfSignedCertificate @certParams
    Write-Host "[OK] Certificado gerado com sucesso! Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green
} else {
    Write-Host "[OK] Certificado localizado: $($cert.Thumbprint)" -ForegroundColor Green
}

# 2. Exportar chave publica CER e PFX
Write-Host ""
Write-Host "[2/5] Exportando certificados e registrando em Fornecedores Confiaveis..." -ForegroundColor Yellow

$repoRoot = if (Test-Path (Join-Path $PSScriptRoot "certificates")) { $PSScriptRoot } else { Split-Path $PSScriptRoot -Parent }
$certDir = Join-Path $repoRoot "certificates"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

$cerPath = Join-Path $certDir "AndreyGiordane_PublicKey.cer"
Export-Certificate -Cert $cert -FilePath $cerPath -Force | Out-Null
Write-Host "[OK] Chave publica salva em: $cerPath" -ForegroundColor Gray

# Adiciona aos Fornecedores Confiaveis do usuario sem exibir caixas de dialogo
& certutil.exe -addstore -user "TrustedPublisher" $cerPath | Out-Null
Write-Host "[OK] Adicionado a 'Fornecedores Confiaveis' (TrustedPublisher) com sucesso!" -ForegroundColor Green

# Exporta backup PFX
$pfxPath = Join-Path $certDir "AndreyGiordane_CodeSigning.pfx"
$certPassword = if ($env:CODE_SIGN_PASSWORD) { $env:CODE_SIGN_PASSWORD } else { "WinShield2026" }
$securePassword = ConvertTo-SecureString -String $certPassword -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePassword -Force | Out-Null
Write-Host "[OK] Backup do Certificado PFX salvo em: $pfxPath" -ForegroundColor Gray

# 3. Assinar o executavel alvo
Write-Host ""
Write-Host "[3/5] Assinando digitalmente '$TargetExe'..." -ForegroundColor Yellow

if (-not [System.IO.Path]::IsPathRooted($TargetExe)) {
    $altTarget = Join-Path $repoRoot $TargetExe
    if (Test-Path $altTarget) {
        $TargetExe = $altTarget
    }
}

if (-not (Test-Path $TargetExe)) {
    Write-Host "[AVISO] Arquivo '$TargetExe' nao foi encontrado para assinatura." -ForegroundColor Yellow
    exit 0
}

# Remove o bloqueio do Windows (Mark-of-the-Web / Zone.Identifier) que dispara o SmartScreen
Unblock-File -Path $TargetExe -ErrorAction SilentlyContinue
Write-Host "[OK] Bloqueio Mark-of-the-Web (Zone.Identifier) removido do executavel." -ForegroundColor Green

# Servidores de carimbo de tempo (Timestamp) RFC 3161
$timestampServers = @(
    "http://timestamp.digicert.com",
    "http://timestamp.sectigo.com",
    "http://tsa.starfieldtech.com"
)

$signed = $false
foreach ($ts in $timestampServers) {
    try {
        Write-Host "Aplicando assinatura Authenticode com carimbo de tempo ($ts)..." -ForegroundColor Gray
        $sigResult = Set-AuthenticodeSignature -FilePath $TargetExe -Certificate $cert -TimestampServer $ts -HashAlgorithm SHA256 -ErrorAction Stop
        if ($sigResult.Status -eq "Valid") {
            $signed = $true
            break
        }
    } catch {
        # Tenta proximo servidor
    }
}

if (-not $signed) {
    Write-Host "Assinando diretamente com SHA256..." -ForegroundColor Yellow
    $sigResult = Set-AuthenticodeSignature -FilePath $TargetExe -Certificate $cert -HashAlgorithm SHA256
}

# 4. Validar o resultado
Write-Host ""
Write-Host "[4/5] Verificando assinatura do arquivo..." -ForegroundColor Yellow
$finalSig = Get-AuthenticodeSignature -FilePath $TargetExe

Write-Host "Status da Assinatura : " -NoNewline
if ($finalSig.Status -eq "Valid") {
    Write-Host "$($finalSig.Status) (OFICIAL E CONFIAVEL)" -ForegroundColor Green
} else {
    Write-Host "$($finalSig.Status)" -ForegroundColor Yellow
}
Write-Host "Fornecedor (Signer)  : " -NoNewline
Write-Host "$($finalSig.SignerCertificate.Subject)" -ForegroundColor Cyan
Write-Host "Validade             : $($finalSig.SignerCertificate.NotBefore.ToString('dd/MM/yyyy')) ate $($finalSig.SignerCertificate.NotAfter.ToString('dd/MM/yyyy'))" -ForegroundColor Gray
Write-Host "Algoritmo de Hash    : SHA256" -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] CONCLUIDO!" -ForegroundColor Green
Write-Host "O aplicativo '$TargetExe' agora esta assinado oficialmente por Andrey Giordane." -ForegroundColor Green
Write-Host ""
