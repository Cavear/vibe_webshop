<?php
// Plaatst een testbestelling (geen echte betaling).
//
// Verwacht een POST met JSON:
//   { "naam": "...", "email": "...", "regels": [ { "id": "kaars", "aantal": 2 }, ... ] }
// Prijzen uit het verzoek worden genegeerd: de server haalt ze uit de database.
//
// Antwoord (JSON):
//   201 { ok: true, bestelnummer, totaal_cent }
//   422 { ok: false, fouten: { naam?, email?, mandje? } }
//   400/405/415/503 { ok: false, melding }

require __DIR__ . '/db.php';

const MAX_AANTAL = 99;
const MAX_REGELS = 50;

header('Content-Type: application/json; charset=utf-8');

function antwoord(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    antwoord(405, ['ok' => false, 'melding' => 'Alleen POST is toegestaan.']);
}

// Alleen JSON accepteren; een gewoon HTML-formulier van een andere site kan dit niet versturen.
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    antwoord(415, ['ok' => false, 'melding' => 'Verwacht JSON.']);
}

$invoer = json_decode(file_get_contents('php://input'), true);
if (!is_array($invoer)) {
    antwoord(400, ['ok' => false, 'melding' => 'Ongeldig verzoek.']);
}

// ===== Invoer controleren =====
$fouten = [];

$naam = is_string($invoer['naam'] ?? null) ? trim($invoer['naam']) : '';
if ($naam === '') {
    $fouten['naam'] = 'Vul je naam in.';
} elseif (mb_strlen($naam) > 100) {
    $fouten['naam'] = 'Je naam mag maximaal 100 tekens lang zijn.';
}

$email = is_string($invoer['email'] ?? null) ? trim($invoer['email']) : '';
if ($email === '') {
    $fouten['email'] = 'Vul je e-mailadres in.';
} elseif (strlen($email) > 255 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    $fouten['email'] = 'Vul een geldig e-mailadres in.';
}

// Regels samenvoegen tot [slug => aantal]
$gevraagd = [];
$regels = $invoer['regels'] ?? null;
if (!is_array($regels) || count($regels) === 0) {
    $fouten['mandje'] = 'Je mandje is leeg.';
} elseif (count($regels) > MAX_REGELS) {
    $fouten['mandje'] = 'Je mandje bevat te veel regels.';
} else {
    foreach ($regels as $regel) {
        $slug = $regel['id'] ?? null;
        $aantal = $regel['aantal'] ?? null;
        if (!is_string($slug) || $slug === '' || !is_int($aantal) || $aantal < 1) {
            $fouten['mandje'] = 'Je mandje bevat een ongeldige regel.';
            break;
        }
        $gevraagd[$slug] = ($gevraagd[$slug] ?? 0) + $aantal;
        if ($gevraagd[$slug] > MAX_AANTAL) {
            $fouten['mandje'] = 'Je kunt maximaal ' . MAX_AANTAL . ' stuks per product bestellen.';
            break;
        }
    }
}

if ($fouten) {
    antwoord(422, ['ok' => false, 'fouten' => $fouten]);
}

// ===== Prijzen ophalen, totaal berekenen en opslaan =====
try {
    $pdo = db();

    $plaatshouders = implode(',', array_fill(0, count($gevraagd), '?'));
    $stmt = $pdo->prepare(
        "SELECT id, slug, naam, prijs_cent FROM producten WHERE slug IN ($plaatshouders)"
    );
    $stmt->execute(array_keys($gevraagd));
    $producten = [];
    foreach ($stmt as $rij) {
        $producten[$rij['slug']] = $rij;
    }

    $onbekend = array_diff(array_keys($gevraagd), array_keys($producten));
    if ($onbekend) {
        antwoord(422, ['ok' => false, 'fouten' => [
            'mandje' => 'Een of meer producten in je mandje bestaan niet (meer). Ververs de pagina.',
        ]]);
    }

    // Alle bedragen in hele centen
    $bestelregels = [];
    $totaalCent = 0;
    foreach ($gevraagd as $slug => $aantal) {
        $product = $producten[$slug];
        $prijsCent = (int) $product['prijs_cent'];
        $regelTotaal = $prijsCent * $aantal;
        $totaalCent += $regelTotaal;
        $bestelregels[] = [(int) $product['id'], $product['naam'], $prijsCent, $aantal, $regelTotaal];
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO bestellingen (naam, email, totaal_cent, status) VALUES (?, ?, ?, 'test')"
        );
        $stmt->execute([$naam, $email, $totaalCent]);
        $bestellingId = (int) $pdo->lastInsertId();

        $bestelnummer = sprintf('TB-%s-%04d', date('Ymd'), $bestellingId);
        $stmt = $pdo->prepare('UPDATE bestellingen SET bestelnummer = ? WHERE id = ?');
        $stmt->execute([$bestelnummer, $bestellingId]);

        $stmt = $pdo->prepare(
            'INSERT INTO bestelregels
                (bestelling_id, product_id, product_naam, prijs_cent, aantal, regel_totaal_cent)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        foreach ($bestelregels as $regel) {
            $stmt->execute(array_merge([$bestellingId], $regel));
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Throwable $e) {
    error_log('Bestelling opslaan mislukt: ' . $e->getMessage());
    antwoord(503, ['ok' => false, 'melding' => 'Je bestelling kon niet worden opgeslagen. Probeer het later opnieuw.']);
}

antwoord(201, ['ok' => true, 'bestelnummer' => $bestelnummer, 'totaal_cent' => $totaalCent]);
