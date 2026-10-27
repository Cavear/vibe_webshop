// @ts-check
const { test, expect } = require('@playwright/test');
const { haalBestelling, aantalBestellingenVoor } = require('./helpers/db');

// Vaste verwachtingen, berekend uit de productgegevens in database/schema.sql:
// kaars 795 cent, mok 995 cent.
// 2 × 795 + 995 = 2585 cent → € 25,85
const TOTAAL_CENT = 2585;
const TOTAAL_TEKST = '€ 25,85';

// Uniek e-mailadres per test, zodat tests elkaar niet beïnvloeden
const uniekEmail = (label) => `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

const inMandje = (page, naam) =>
    page.locator('.product-kaart', { hasText: naam }).getByRole('button');

test('testbestelling: afrekenen, bevestiging en opslag in de database', async ({ page }) => {
    const email = uniekEmail('bestelling');
    await page.goto('./');

    // Producten toevoegen
    await inMandje(page, 'Geurkaars').click();
    await inMandje(page, 'Geurkaars').click();
    await inMandje(page, 'Mok').click();
    await expect(page.locator('#mandje-totaal')).toHaveText(TOTAAL_TEKST);

    // Afrekenen met testgegevens
    await expect(page.locator('#afrekenen')).toBeVisible();
    await page.getByLabel('Naam').fill('Test Klant');
    await page.getByLabel('E-mailadres').fill(email);
    await page.getByRole('button', { name: 'Plaats testbestelling' }).click();

    // Bevestiging met bestelnummer
    const bevestiging = page.locator('#bevestiging');
    await expect(bevestiging).toBeVisible();
    await expect(bevestiging).toContainText('Bedankt voor je testbestelling');
    const nummer = page.locator('#bevestiging-nummer');
    await expect(nummer).toHaveText(/^TB-\d{8}-\d{4,}$/);
    await expect(page.locator('#bevestiging-totaal')).toHaveText(TOTAAL_TEKST);
    const bestelnummer = (await nummer.textContent()) ?? '';

    // Mandje is pas na geslaagde opslag geleegd, ook na verversen
    await expect(page.locator('#mandje-leeg')).toBeVisible();
    await expect(page.locator('#mandje-aantal')).toHaveText('0');
    await expect(page.locator('#afrekenen')).toBeHidden();
    await page.reload();
    await expect(page.locator('#mandje-leeg')).toBeVisible();

    // Opgeslagen bestelling met de juiste producten en bedragen
    const bestelling = haalBestelling(bestelnummer);
    expect(bestelling).not.toBeNull();
    expect(bestelling).toMatchObject({
        bestelnummer,
        naam: 'Test Klant',
        email,
        totaal_cent: TOTAAL_CENT,
        status: 'test',
    });
    expect(bestelling.regels).toEqual([
        { slug: 'kaars', product_naam: 'Geurkaars', prijs_cent: 795, aantal: 2, regel_totaal_cent: 1590 },
        { slug: 'mok', product_naam: 'Mok', prijs_cent: 995, aantal: 1, regel_totaal_cent: 995 },
    ]);
});

test('leeg mandje levert geen bestelling op', async ({ page, request }) => {
    const email = uniekEmail('leeg');

    // In de winkel: zonder producten is er geen afrekenformulier
    await page.goto('./');
    await expect(page.locator('#mandje-leeg')).toBeVisible();
    await expect(page.locator('#afrekenen')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Plaats testbestelling' })).toBeHidden();

    // Rechtstreeks naar de server: een leeg mandje wordt afgewezen
    const antwoord = await request.post('bestellen.php', {
        data: { naam: 'Test Klant', email, regels: [] },
    });
    expect(antwoord.status()).toBe(422);
    const body = await antwoord.json();
    expect(body.ok).toBe(false);
    expect(body.fouten.mandje).toBe('Je mandje is leeg.');

    expect(aantalBestellingenVoor(email)).toBe(0);
});

test('ongeldig e-mailadres: geen bestelling en mandje blijft staan', async ({ page }) => {
    await page.goto('./');
    await inMandje(page, 'Mok').click();

    await page.getByLabel('Naam').fill('Test Klant');
    await page.getByLabel('E-mailadres').fill('geen-emailadres');
    await page.getByRole('button', { name: 'Plaats testbestelling' }).click();

    await expect(page.locator('#email-fout')).toHaveText('Vul een geldig e-mailadres in.');
    await expect(page.locator('#bevestiging')).toBeHidden();
    await expect(page.locator('#mandje-regels tr')).toHaveCount(1);
    await expect(page.locator('#mandje-aantal')).toHaveText('1');
});

test('server negeert een meegestuurde (gemanipuleerde) prijs', async ({ request }) => {
    const email = uniekEmail('prijs');
    const antwoord = await request.post('bestellen.php', {
        data: { naam: 'Test Klant', email, regels: [{ id: 'mok', aantal: 1, prijs_cent: 1 }] },
    });
    expect(antwoord.status()).toBe(201);
    const body = await antwoord.json();
    expect(body.totaal_cent).toBe(995);

    const bestelling = haalBestelling(body.bestelnummer);
    expect(bestelling.totaal_cent).toBe(995);
    expect(bestelling.regels).toEqual([
        { slug: 'mok', product_naam: 'Mok', prijs_cent: 995, aantal: 1, regel_totaal_cent: 995 },
    ]);
});
