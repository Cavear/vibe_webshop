<?php
// Hulpscript voor de Playwright-tests: leest bestellingen uit de database
// met dezelfde config.php als de site. Alleen via de commandline te gebruiken.
//
//   php tests/db-helper.php bestelling TB-20261027-0001
//   php tests/db-helper.php aantal-voor-email iemand@example.com
//
// Zet WEBSHOP_CONFIG op het pad van een andere config.php om een andere omgeving te lezen.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

// Met WEBSHOP_CONFIG lees je de database van een andere omgeving, bijvoorbeeld TEST
if (getenv('WEBSHOP_CONFIG')) {
    define('CONFIG_BESTAND', getenv('WEBSHOP_CONFIG'));
}

require __DIR__ . '/../db.php';

$actie = $argv[1] ?? '';
$waarde = $argv[2] ?? '';

switch ($actie) {
    case 'bestelling':
        $stmt = db()->prepare(
            'SELECT id, bestelnummer, naam, email, totaal_cent, status FROM bestellingen WHERE bestelnummer = ?'
        );
        $stmt->execute([$waarde]);
        $bestelling = $stmt->fetch() ?: null;

        if ($bestelling) {
            $stmt = db()->prepare(
                'SELECT p.slug, r.product_naam, r.prijs_cent, r.aantal, r.regel_totaal_cent
                 FROM bestelregels r
                 JOIN producten p ON p.id = r.product_id
                 WHERE r.bestelling_id = ?
                 ORDER BY p.slug'
            );
            $stmt->execute([$bestelling['id']]);
            $bestelling['regels'] = $stmt->fetchAll();
        }
        $resultaat = $bestelling;
        break;

    case 'aantal-voor-email':
        $stmt = db()->prepare('SELECT COUNT(*) FROM bestellingen WHERE email = ?');
        $stmt->execute([$waarde]);
        $resultaat = (int) $stmt->fetchColumn();
        break;

    default:
        fwrite(STDERR, "Onbekende actie: $actie\n");
        exit(1);
}

echo json_encode($resultaat, JSON_UNESCAPED_UNICODE);
