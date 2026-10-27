<?php
// Voorbeeldproducten (komen later uit de database)
$producten = [
    [
        'naam'         => 'Geurkaars',
        'prijs'        => 7.95,
        'beschrijving' => 'Een zachte vanillegeur voor gezellige avonden.',
        'icoon'        => '🕯️',
    ],
    [
        'naam'         => 'Notitieboek',
        'prijs'        => 4.50,
        'beschrijving' => 'Handzaam boekje voor ideeën, lijstjes en krabbels.',
        'icoon'        => '📓',
    ],
    [
        'naam'         => 'Mok',
        'prijs'        => 9.95,
        'beschrijving' => 'Stevige keramische mok voor koffie of thee.',
        'icoon'        => '☕',
    ],
];

function formatPrijs(float $prijs): string
{
    return '€ ' . number_format($prijs, 2, ',', '.');
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
        <div class="container">
            <a href="index.php" class="logo">Cadeauwinkel</a>
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
            <div class="producten">
                <?php foreach ($producten as $product): ?>
                    <article class="product-kaart">
                        <div class="product-afbeelding" aria-hidden="true"><?= $product['icoon'] ?></div>
                        <h3><?= htmlspecialchars($product['naam']) ?></h3>
                        <p class="beschrijving"><?= htmlspecialchars($product['beschrijving']) ?></p>
                        <p class="prijs"><?= formatPrijs($product['prijs']) ?></p>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    </main>

    <footer class="voet">
        <div class="container">
            <p>&copy; <?= date('Y') ?> Cadeauwinkel</p>
        </div>
    </footer>
</body>
</html>
