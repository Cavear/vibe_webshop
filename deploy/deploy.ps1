# Zet de code uit deze map neer in de TEST- of PROD-omgeving (XAMPP) en controleert de site.
#
#   powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1 -Omgeving test
#
# Stappen:
#   1. bestanden kopieren (alleen wat de site nodig heeft; config.php blijft staan)
#   2. .htaccess met instellingen per omgeving schrijven
#   3. database/schema.sql uitvoeren (veilig herhaalbaar)
#   4. rooktest: laadt de homepage met producten?
#
# De omgeving moet eerst eenmalig zijn ingericht met deploy\inrichten.ps1.

param(
    [Parameter(Mandatory)][ValidateSet('test', 'prod')][string]$Omgeving,
    [string]$Xampp = 'C:\xampp'
)

$ErrorActionPreference = 'Stop'

$bron = Split-Path $PSScriptRoot -Parent
$doel = Join-Path $Xampp "htdocs\vibe_webshop_$Omgeving"
$url = "http://localhost/vibe_webshop_$Omgeving/"
$php = Join-Path $Xampp 'php\php.exe'
$mysql = Join-Path $Xampp 'mysql\bin\mysql.exe'

if (-not (Test-Path (Join-Path $doel 'config.php'))) {
    throw "$doel\config.php ontbreekt. Richt de omgeving eerst in met deploy\inrichten.ps1 -Omgeving $Omgeving."
}

# ===== 1. Bestanden kopieren =====
Write-Host "== Bestanden kopieren naar $doel"
# /MIR verwijdert in het doel wat niet meer in de bron staat; uitgesloten bestanden en mappen blijven staan.
$uitgeslotenMappen = @('.git', '.github', '.claude', '.vscode', 'database', 'deploy', 'tests',
    'node_modules', 'test-results', 'playwright-report')
$uitgeslotenBestanden = @('config.php', 'config.example.php', '.htaccess', '.gitignore', '*.md',
    'package.json', 'package-lock.json', 'playwright.config.js')
robocopy $bron $doel /MIR /XD @uitgeslotenMappen /XF @uitgeslotenBestanden /NFL /NDL /NJH /NP
if ($LASTEXITCODE -ge 8) { throw "Kopieren mislukt (robocopy-code $LASTEXITCODE)." }

# ===== 2. Instellingen per omgeving =====
Write-Host '== .htaccess schrijven'
$htaccess = @"
# Aangemaakt door deploy\deploy.ps1 voor de $($Omgeving.ToUpper())-omgeving. Niet met de hand aanpassen.

# Geen PHP-foutmeldingen aan bezoekers tonen; ze gaan naar het foutlog
<IfModule php_module>
    php_flag display_errors off
    php_flag log_errors on
</IfModule>

# config.php nooit via de webserver aanbieden
<Files "config.php">
    Require all denied
</Files>
"@
if ($Omgeving -eq 'test') {
    $htaccess += @"


# De testomgeving niet laten opnemen door zoekmachines
<IfModule mod_headers.c>
    Header set X-Robots-Tag "noindex, nofollow"
</IfModule>
"@
}
[IO.File]::WriteAllText((Join-Path $doel '.htaccess'), $htaccess, (New-Object Text.UTF8Encoding $false))

# ===== 3. Database bijwerken =====
Write-Host '== Database bijwerken'
$configPad = (Join-Path $doel 'config.php') -replace '\\', '/'
$db = & $php -r "echo json_encode((require '$configPad')['db']);" | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $db) { throw 'config.php kon niet worden gelezen.' }

$env:MYSQL_PWD = $db.wachtwoord
Push-Location $bron
try {
    & $mysql -h $db.host -P $db.poort -u $db.gebruiker --default-character-set=utf8mb4 $db.database -e 'source database/schema.sql'
    if ($LASTEXITCODE -ne 0) { throw 'database/schema.sql uitvoeren mislukt.' }
} finally {
    Pop-Location
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

# ===== 4. Rooktest =====
Write-Host "== Rooktest op $url"
try {
    $pagina = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 30
} catch {
    throw "Rooktest mislukt: $url gaf een fout ($($_.Exception.Message))."
}
$aantal = ([regex]::Matches($pagina.Content, 'class="product-kaart"')).Count
if ($aantal -lt 1) { throw "Rooktest mislukt: geen producten op $url." }

$balk = $pagina.Content -match 'class="omgeving-balk'
if ($Omgeving -eq 'prod' -and $balk) { throw 'Rooktest mislukt: de omgevingsbalk staat op PROD (klopt config.php?).' }
if ($Omgeving -eq 'test' -and -not $balk) { throw 'Rooktest mislukt: de TEST-balk ontbreekt (klopt config.php?).' }

try {
    Invoke-WebRequest ($url + 'config.php') -UseBasicParsing -TimeoutSec 30 | Out-Null
    throw 'Rooktest mislukt: config.php is via de webserver op te vragen.'
} catch [System.Net.WebException] {
    # 403 is precies wat we willen
}

Write-Host "Deploy naar $($Omgeving.ToUpper()) geslaagd: $url ($aantal producten)."
exit 0
