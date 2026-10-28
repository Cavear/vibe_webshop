<?php
// Voorbeeldconfiguratie. Kopieer dit bestand naar config.php en vul je
// eigen gegevens in. config.php staat in .gitignore en komt dus niet in Git.
return [
    // Welke omgeving dit is: 'dev', 'test' of 'prod'. Buiten prod staat er een balk bovenaan de site.
    'omgeving' => 'dev',
    'db' => [
        'host'       => '127.0.0.1',
        'poort'      => 3306,
        'database'   => 'vibe_webshop',
        'gebruiker'  => 'VUL_IN',
        'wachtwoord' => 'VUL_IN',
        'charset'    => 'utf8mb4',
    ],
];
