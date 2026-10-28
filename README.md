# Cadeauwinkel (vibe_webshop)

Een kleine oefenwebshop met drie cadeauproducten, een winkelmandje en
afrekenen met een **testbestelling** (er wordt niet echt betaald).
Gebouwd met PHP, MariaDB, HTML, CSS en JavaScript, zonder frameworks.

## Wat heb je nodig?

- [XAMPP](https://www.apachefriends.org/) met **Apache**, **MySQL/MariaDB** en **PHP 8**
- Een webbrowser
- Alleen voor de tests: [Node.js](https://nodejs.org/) (LTS)

## De webshop starten via XAMPP

### 1. Zet het project op de juiste plek

De projectmap moet in de webmap van XAMPP staan:

```
C:\xampp\htdocs\vibe_webshop
```

Haal je het project van GitHub, dan kan dat zo (in een terminal):

```
cd C:\xampp\htdocs
git clone https://github.com/Cavear/vibe_webshop.git
```

### 2. Start Apache en MySQL

1. Open het **XAMPP Control Panel**.
2. Klik op **Start** bij **Apache**.
3. Klik op **Start** bij **MySQL**.

Beide regels moeten groen worden.

### 3. Maak de databaseconfiguratie aan

De echte verbindingsgegevens staan in `config.php`. Dat bestand zit
bewust **niet** in Git. Maak het aan door het voorbeeld te kopiëren:

```
cd C:\xampp\htdocs\vibe_webshop
copy config.example.php config.php
```

Open `config.php` en vul je eigen gegevens in. Bij een standaard
XAMPP-installatie op je eigen computer is dat meestal:

| Instelling   | Waarde         |
|--------------|----------------|
| `host`       | `127.0.0.1`    |
| `poort`      | `3306`         |
| `database`   | `vibe_webshop` |
| `gebruiker`  | `root`         |
| `wachtwoord` | *(leeg)*       |

> Gebruik `root` zonder wachtwoord alleen op je eigen computer,
> nooit op een server die online staat.

### 4. Maak de database en tabellen aan

Maak eerst (eenmalig) de database aan:

```
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS vibe_webshop CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
```

Importeer daarna het schema met de startproducten (vanuit de projectmap;
werkt in zowel PowerShell als de Opdrachtprompt):

```
cd C:\xampp\htdocs\vibe_webshop
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 vibe_webshop -e "source database/schema.sql"
```

Dit importeren kun je veilig vaker doen: bestaande producten worden
bijgewerkt, niet dubbel toegevoegd, en er wordt niets verwijderd.

> Liever met de muis? Open http://localhost/phpmyadmin/, maak de database
> `vibe_webshop` aan en importeer `database/schema.sql` via het tabblad
> **Importeren**.

### 5. Open de webshop

Ga in je browser naar:

**http://localhost/vibe_webshop/**

Je ziet nu de drie producten. Voeg iets toe aan het mandje en plaats
een testbestelling.

## Problemen oplossen

| Probleem | Oplossing |
|----------|-----------|
| De pagina laadt niet | Controleer of **Apache** draait in het XAMPP Control Panel. |
| Apache start niet | Poort 80 is waarschijnlijk bezet (bijv. door Skype of IIS). Sluit dat programma of wijzig de poort in XAMPP. |
| "De producten kunnen op dit moment niet worden geladen" | Controleer of **MySQL** draait, of `config.php` bestaat en klopt, en of stap 4 is uitgevoerd. De precieze fout staat in `C:\xampp\apache\logs\error.log`. |
| Oude opmaak of oud gedrag | Ververs de pagina met **Ctrl + F5**. |
| Mandje leegmaken | Druk op **F12** → **Application** → **Local Storage** en verwijder `cadeauwinkel-mandje`. |

## Tests draaien (optioneel)

De tests gebruiken [Playwright](https://playwright.dev/) met Chromium.
Apache en MySQL moeten draaien.

Eenmalig installeren:

```
npm install
npx playwright install chromium
```

Tests draaien:

```
npm test              # zonder zichtbaar browservenster
npm run test:headed   # met zichtbaar browservenster
```

Staat PHP niet in `C:\xampp\php\php.exe`? Geef dan het pad op met de
omgevingsvariabele `PHP_BIN`.

> De tests plaatsen echte testbestellingen in je lokale database
> (herkenbaar aan `status = 'test'`).

### Tests op GitHub (Actions)

Bij elke pull request draaien de tests ook automatisch op GitHub
(`.github/workflows/tests.yml`). Daar is geen XAMPP: de workflow gebruikt
een tijdelijke MariaDB-database en de ingebouwde PHP-server. De test voor
`.htaccess` wordt daar overgeslagen, omdat alleen Apache dat bestand
gebruikt. Het resultaat zie je bij de pull request of op het tabblad
**Actions**.

## Omgevingen: DEV, TEST en PROD

Alle drie draaien in XAMPP op dezelfde computer, elk met een eigen map en
een eigen database:

| Omgeving | Adres | Database | Bijgewerkt |
| --- | --- | --- | --- |
| DEV | <http://localhost/vibe_webshop/> | `vibe_webshop` | Terwijl je werkt (je Git-map) |
| TEST | <http://localhost/vibe_webshop_test/> | `vibe_webshop_test` | Automatisch na een merge naar `main` |
| PROD | <http://localhost/vibe_webshop_prod/> | `vibe_webshop_prod` | Als jij een release maakt |

Op DEV en TEST staat bovenaan een gekleurde balk met de naam van de
omgeving; op PROD niet.

### De werkwijze

1. Werk op een eigen branch en test op **DEV**.
2. Open een pull request. De tests draaien op GitHub.
3. Groen? Merge naar `main`. De workflow **Deploy TEST** draait de tests
   opnieuw, zet de code op **TEST** en draait daar alle tests.
4. Klopt alles op TEST? Maak op GitHub een **release** (bijv. `v1.0.0`)
   vanaf `main`. De workflow **Deploy PROD** zet die versie op **PROD** en
   doet een korte rooktest. Op PROD worden geen testbestellingen geplaatst.
   Je kunt ook op het tabblad **Actions** bij **Deploy PROD** op
   **Run workflow** klikken (alleen code die op `main` staat mag naar PROD).

### Wat er bij een deploy gebeurt

Het script `deploy/deploy.ps1` kopieert alleen de bestanden die de site
nodig heeft (geen tests, documentatie of `node_modules`), schrijft een
`.htaccess` met instellingen per omgeving (geen foutmeldingen tonen,
`config.php` afschermen), voert `database/schema.sql` uit en controleert
of de homepage met producten laadt. `config.php` in de doelmap blijft
altijd staan.

### Eenmalig inrichten

TEST en PROD maak je één keer aan (map, database, eigen databasegebruiker
en `config.php`):

```
powershell -ExecutionPolicy Bypass -File deploy\inrichten.ps1 -Omgeving test
powershell -ExecutionPolicy Bypass -File deploy\inrichten.ps1 -Omgeving prod
```

De deploys worden uitgevoerd door een **self-hosted GitHub Actions-runner**
op deze computer, met het label `xampp`. Die moet draaien (en XAMPP ook),
anders blijven de deploys op GitHub wachten.

Met de hand deployen kan ook:

```
powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1 -Omgeving test
```

## Projectstructuur

```
index.php            Homepage met producten, mandje en afrekenen
bestellen.php        Slaat een testbestelling op (server rekent de prijzen)
db.php               Configuratie en databaseverbinding (PDO)
mandje.js            Winkelmandje (localStorage) en afrekenformulier
style.css            Opmaak met CSS-variabelen
config.example.php   Voorbeeld voor config.php (config.php staat niet in Git)
database/schema.sql  Tabellen en startproducten
tests/               Playwright-tests
deploy/              Scripts om TEST en PROD in te richten en bij te werken
.github/workflows/   Tests (CI), Deploy TEST en Deploy PROD
```
