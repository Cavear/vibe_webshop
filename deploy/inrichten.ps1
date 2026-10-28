# Eenmalig: richt de TEST- of PROD-omgeving in op deze computer (XAMPP).
#
#   powershell -ExecutionPolicy Bypass -File deploy\inrichten.ps1 -Omgeving test
#   powershell -ExecutionPolicy Bypass -File deploy\inrichten.ps1 -Omgeving prod
#
# Maakt aan (als ze nog niet bestaan):
#   - de map      C:\xampp\htdocs\vibe_webshop_<omgeving>
#   - de database vibe_webshop_<omgeving>
#   - een eigen databasegebruiker webshop_<omgeving> met een willekeurig wachtwoord
#   - config.php in de map, met die gegevens
#
# Het wachtwoord staat alleen in die config.php (buiten Git).
# Bestaat config.php al, dan wordt er niets aangepast.

param(
    [Parameter(Mandatory)][ValidateSet('test', 'prod')][string]$Omgeving,
    [string]$Xampp = 'C:\xampp',
    [string]$RootWachtwoord = ''
)

$ErrorActionPreference = 'Stop'

$doel = Join-Path $Xampp "htdocs\vibe_webshop_$Omgeving"
$config = Join-Path $doel 'config.php'
$database = "vibe_webshop_$Omgeving"
$gebruiker = "webshop_$Omgeving"
$mysql = Join-Path $Xampp 'mysql\bin\mysql.exe'

if (Test-Path $config) {
    Write-Host "$config bestaat al; er is niets aangepast."
    exit 0
}

New-Item -ItemType Directory -Force $doel | Out-Null

# Willekeurig wachtwoord van 24 tekens (letters en cijfers)
$tekens = [char[]]'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
$wachtwoord = -join (1..24 | ForEach-Object { $tekens | Get-Random })

# Alleen rechten op de eigen database; geen root
$sql = @"
CREATE DATABASE IF NOT EXISTS $database CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '$gebruiker'@'localhost' IDENTIFIED BY '$wachtwoord';
ALTER USER '$gebruiker'@'localhost' IDENTIFIED BY '$wachtwoord';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON $database.* TO '$gebruiker'@'localhost';
"@

$env:MYSQL_PWD = $RootWachtwoord
$sql | & $mysql -u root
if ($LASTEXITCODE -ne 0) { throw 'Database of gebruiker aanmaken mislukt.' }
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

$inhoud = @"
<?php
// Configuratie voor de $($Omgeving.ToUpper())-omgeving. Aangemaakt door deploy\inrichten.ps1.
// Staat niet in Git en wordt bij een deploy niet overschreven.
return [
    'omgeving' => '$Omgeving',
    'db' => [
        'host'       => '127.0.0.1',
        'poort'      => 3306,
        'database'   => '$database',
        'gebruiker'  => '$gebruiker',
        'wachtwoord' => '$wachtwoord',
        'charset'    => 'utf8mb4',
    ],
];
"@
[IO.File]::WriteAllText($config, $inhoud, (New-Object Text.UTF8Encoding $false))

Write-Host "Omgeving '$Omgeving' ingericht: $doel (database $database, gebruiker $gebruiker)."
