<?php
// Configuratie, databaseverbinding (PDO) en het ophalen van producten.

function config(): array
{
    static $config = null;

    if ($config === null) {
        // tests/db-helper.php kan een andere config.php opgeven (bijv. die van TEST)
        $configBestand = defined('CONFIG_BESTAND') ? CONFIG_BESTAND : __DIR__ . '/config.php';
        if (!is_file($configBestand)) {
            throw new RuntimeException('config.php ontbreekt; kopieer config.example.php naar config.php.');
        }
        $config = require $configBestand;
    }

    return $config;
}

// 'dev', 'test' of 'prod'. Zonder (geldige) config.php gaan we uit van 'dev'.
function omgeving(): string
{
    try {
        return config()['omgeving'] ?? 'dev';
    } catch (Throwable $e) {
        return 'dev';
    }
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $db = config()['db'];

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $db['host'],
            $db['poort'],
            $db['database'],
            $db['charset']
        );

        $pdo = new PDO($dsn, $db['gebruiker'], $db['wachtwoord'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $pdo;
}

// Geeft de producten terug in dezelfde vorm als de vroegere vaste array,
// met de slug als 'id' zodat het winkelmandje dezelfde identifiers houdt.
function haalProducten(): array
{
    $sql = 'SELECT slug, naam, beschrijving, prijs_cent, icoon
            FROM producten
            ORDER BY sortering, id';

    $producten = [];
    foreach (db()->query($sql) as $rij) {
        $producten[] = [
            'id'           => $rij['slug'],
            'naam'         => $rij['naam'],
            'prijs_cent'   => (int) $rij['prijs_cent'],
            'beschrijving' => $rij['beschrijving'],
            'icoon'        => $rij['icoon'],
        ];
    }

    return $producten;
}
