---
name: webshop-check
description: Controleert of de lokale webshop op http://localhost/vibe_webshop/ bereikbaar is, draait de bestaande Playwright-tests en meldt kort wat slaagt, faalt of niet getest kon worden.
disable-model-invocation: true
---

# Webshop-check

Voer een controle uit van de lokale webshop en rapporteer het resultaat.
Dit is een **alleen-lezen controle**: verander bij fouten niets aan code,
tests, configuratie of database. Meld wat je ziet en stop.

## Regels

- **Niets automatisch repareren.** Pas geen code, tests, `playwright.config.js`,
  `config.php` of `database/schema.sql` aan, ook niet als een fout voor de hand
  liggend lijkt. Je mag wel een mogelijke oorzaak noemen.
- **Geen installaties.** Voer geen `npm install`, `npx playwright install` of
  winget uit. Ontbreekt er iets, meld dat met de opdracht die de gebruiker
  zelf kan draaien.
- **Alleen fictieve gegevens.** Testbestellingen gebruiken uitsluitend
  verzonnen gegevens, zoals naam `Test Klant` en e-mailadressen op
  `@example.com`. Gebruik nooit echte namen of e-mailadressen, ook niet die
  van de gebruiker of uit Git.
- **Geen database opruimen.** De tests plaatsen testbestellingen
  (`status = 'test'`); verwijder die niet.
- **Eerlijk rapporteren.** Meld een test die niet is uitgevoerd als
  "niet getest", nooit als geslaagd.

## Stappen

Voer de opdrachten uit vanuit de projectmap (`C:\xampp\htdocs\vibe_webshop`).

### 1. Bereikbaarheid van de site

```bash
curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost/vibe_webshop/
```

| HTTP-code | Betekenis | Vervolg |
|---|---|---|
| `200` | Site bereikbaar | Ga door naar stap 2 |
| `503` | Site draait, maar de database is niet bereikbaar (MySQL uit of `config.php` onjuist) | Ga door; databasetests zullen waarschijnlijk falen |
| `000` | Geen verbinding: Apache draait waarschijnlijk niet | **Stop.** Meld dat de site onbereikbaar is en dat er niets getest is. Advies: start Apache in het XAMPP Control Panel |
| anders | Onverwacht antwoord | Meld de code en ga door |

### 2. Zijn de tests aanwezig?

Controleer dat deze bestaan:

- `playwright.config.js`
- minstens één `tests/*.spec.js`
- `node_modules/@playwright/test`

Ontbreekt de configuratie of zijn er geen testbestanden: meld dat eerlijk
("er zijn geen Playwright-tests gevonden") en sla stap 3 over.
Ontbreekt alleen `node_modules`: meld dat de gebruiker eerst
`npm install` en `npx playwright install chromium` moet draaien.

Noem welke testbestanden en hoeveel tests er zijn:

```bash
npx playwright test --list
```

### 3. Tests uitvoeren

Gebruik de bestaande configuratie (Chromium, baseURL uit
`playwright.config.js`), headless:

```bash
npx playwright test --reporter=list
```

Geef de opdracht een ruime time-out (enkele minuten). Pas geen extra
opties toe die de configuratie overschrijven.

### 4. Rapport

Geef een kort rapport in het Nederlands:

```
Webshop-check

Site: http://localhost/vibe_webshop/ → HTTP 200 (bereikbaar)

Tests (Chromium, headless): 4 geslaagd, 1 gefaald, 0 niet getest

  ✓ mandje: toevoegen, bewaren na verversen en verwijderen
  ✓ testbestelling: afrekenen, bevestiging en opslag in de database
  ✘ leeg mandje levert geen bestelling op
      verwacht 422, kreeg 503 (tests/bestellen.spec.js:78)
  ...

Mogelijke oorzaak: ... (niets aangepast)
```

- Bij een fout: noem de testnaam, de kern van de melding
  (verwacht vs. ontvangen) en het bestand met regelnummer. Geen volledige
  stacktraces.
- Vermeld dat geslaagde bestellingstests testbestellingen met fictieve
  gegevens aan de lokale database hebben toegevoegd.
- Sluit af met: er is niets aangepast.
