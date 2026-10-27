<?php
require __DIR__ . '/db.php';

// Producten uit de database (prijzen in centen).
// Bij een databasefout krijgt de bezoeker een nette melding; details gaan naar het foutlog.
$producten = null;
try {
    $producten = haalProducten();
} catch (Throwable $e) {
    error_log('Producten laden mislukt: ' . $e->getMessage());
    http_response_code(503);
}

function formatPrijs(int $cent): string
{
    return '€ ' . number_format($cent / 100, 2, ',', '.');
}
?>
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadeauwinkel</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="kop">
        <div class="container kop-inhoud">
            <a href="index.php" class="logo">Cadeauwinkel</a>
            <a href="#mandje" class="mandje-link">Mandje (<span id="mandje-aantal">0</span>)</a>
        </div>
    </header>

    <main>
        <section class="intro">
            <div class="container">
                <h1>Kleine cadeaus, grote glimlach</h1>
                <p>Op zoek naar iets leuks voor een ander, of voor jezelf? Bekijk onze zorgvuldig gekozen cadeautjes.</p>
            </div>
        </section>

        <section class="container">
            <h2>Onze producten</h2>
            <?php if ($producten === null): ?>
                <p class="melding">De producten kunnen op dit moment niet worden geladen. Probeer het later opnieuw.</p>
            <?php elseif (count($producten) === 0): ?>
                <p class="melding">Er zijn nog geen producten.</p>
            <?php else: ?>
            <div class="producten">
                <?php foreach ($producten as $product): ?>
                    <article class="product-kaart">
                        <div class="product-afbeelding" aria-hidden="true"><?= $product['icoon'] ?></div>
                        <h3><?= htmlspecialchars($product['naam']) ?></h3>
                        <p class="beschrijving"><?= htmlspecialchars($product['beschrijving']) ?></p>
                        <p class="prijs"><?= formatPrijs($product['prijs_cent']) ?></p>
                        <button type="button" class="knop"
                                data-product-id="<?= htmlspecialchars($product['id']) ?>"
                                data-naam="<?= htmlspecialchars($product['naam']) ?>"
                                data-prijs-cent="<?= (int) $product['prijs_cent'] ?>">In mandje</button>
                    </article>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </section>

        <section id="mandje" class="container mandje">
            <h2>Winkelmandje</h2>
            <p id="mandje-leeg" class="mandje-leeg">Je mandje is nog leeg.</p>
            <div class="mandje-scroll">
            <table id="mandje-tabel" class="mandje-tabel" hidden>
                <thead>
                    <tr>
                        <th scope="col">Product</th>
                        <th scope="col" class="kolom-prijs">Prijs</th>
                        <th scope="col">Aantal</th>
                        <th scope="col">Totaal</th>
                        <th scope="col"><span class="visueel-verborgen">Verwijderen</span></th>
                    </tr>
                </thead>
                <tbody id="mandje-regels"></tbody>
                <tfoot>
                    <tr>
                        <th scope="row">Totaalbedrag</th>
                        <td class="kolom-prijs"></td>
                        <td></td>
                        <td id="mandje-totaal"></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            </div>
        </section>

        <section id="bevestiging" class="container" tabindex="-1" hidden>
            <div class="bevestiging">
                <h2>Bedankt voor je testbestelling!</h2>
                <p>Je bestelnummer is <strong id="bevestiging-nummer"></strong>.</p>
                <p>Totaalbedrag: <strong id="bevestiging-totaal"></strong></p>
                <p class="test-uitleg">Dit was een testbestelling: er is niets betaald en er wordt niets verzonden.</p>
            </div>
        </section>

        <section id="afrekenen" class="container afrekenen" hidden>
            <h2>Afrekenen</h2>
            <p class="test-uitleg">Dit is een testbestelling: er wordt niet betaald.</p>
            <form id="bestel-formulier" class="formulier" novalidate>
                <div class="veld">
                    <label for="naam">Naam</label>
                    <input type="text" id="naam" name="naam" autocomplete="name" maxlength="100" required
                           aria-describedby="naam-fout">
                    <p id="naam-fout" class="veld-fout" hidden></p>
                </div>
                <div class="veld">
                    <label for="email">E-mailadres</label>
                    <input type="email" id="email" name="email" autocomplete="email" maxlength="255" required
                           aria-describedby="email-fout">
                    <p id="email-fout" class="veld-fout" hidden></p>
                </div>
                <p id="formulier-fout" class="formulier-fout" role="alert" hidden></p>
                <button type="submit" id="bestel-knop" class="knop">Plaats testbestelling</button>
            </form>
        </section>
    </main>

    <footer class="voet">
        <div class="container">
            <p>&copy; <?= date('Y') ?> Cadeauwinkel</p>
        </div>
    </footer>

    <script src="mandje.js"></script>
</body>
</html>
