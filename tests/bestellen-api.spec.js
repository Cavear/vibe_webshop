// @ts-check
const { test, expect } = require('@playwright/test');
const { haalBestelling, aantalBestellingenVoor } = require('./helpers/db');

// Rechtstreekse verzoeken aan bestellen.php: foutafhandeling en invoercontrole.

const uniekEmail = (label) => `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

const bestel = (request, data) => request.post('bestellen.php', { data });

test('GET wordt geweigerd met 405', async ({ request }) => {
    const antwoord = await request.get('bestellen.php');
    expect(antwoord.status()).toBe(405);
    expect(antwoord.headers()['allow']).toBe('POST');
    expect((await antwoord.json()).ok).toBe(false);
});

test('geen JSON (gewoon formulier) wordt geweigerd met 415', async ({ request }) => {
    const email = uniekEmail('formulier');
    const antwoord = await request.post('bestellen.php', {
        form: { naam: 'Test Klant', email },
    });
    expect(antwoord.status()).toBe(415);
    expect(aantalBestellingenVoor(email)).toBe(0);
});

test('kapotte JSON wordt geweigerd met 400', async ({ request }) => {
    const antwoord = await request.post('bestellen.php', {
        headers: { 'Content-Type': 'application/json' },
        data: '{dit is geen json',
    });
    expect(antwoord.status()).toBe(400);
    expect(await antwoord.json()).toEqual({ ok: false, melding: 'Ongeldig verzoek.' });
});

test('naam en e-mail ontbreken: beide fouten tegelijk', async ({ request }) => {
    const antwoord = await bestel(request, { regels: [{ id: 'mok', aantal: 1 }] });
    expect(antwoord.status()).toBe(422);
    expect((await antwoord.json()).fouten).toEqual({
        naam: 'Vul je naam in.',
        email: 'Vul je e-mailadres in.',
    });
});

test('te lange naam wordt geweigerd', async ({ request }) => {
    const email = uniekEmail('lange-naam');
    const antwoord = await bestel(request, {
        naam: 'a'.repeat(101), email, regels: [{ id: 'mok', aantal: 1 }],
    });
    expect(antwoord.status()).toBe(422);
    expect((await antwoord.json()).fouten.naam).toBe('Je naam mag maximaal 100 tekens lang zijn.');
    expect(aantalBestellingenVoor(email)).toBe(0);
});

test('onbekend product wordt geweigerd', async ({ request }) => {
    const email = uniekEmail('onbekend');
    const antwoord = await bestel(request, {
        naam: 'Test Klant', email, regels: [{ id: 'bestaat-niet', aantal: 1 }],
    });
    expect(antwoord.status()).toBe(422);
    expect((await antwoord.json()).fouten.mandje).toContain('bestaan niet (meer)');
    expect(aantalBestellingenVoor(email)).toBe(0);
});

const ongeldigeRegels = [
    ['aantal 0', { id: 'mok', aantal: 0 }],
    ['negatief aantal', { id: 'mok', aantal: -1 }],
    ['aantal als tekst', { id: 'mok', aantal: '1' }],
    ['kommagetal', { id: 'mok', aantal: 1.5 }],
    ['ontbrekend id', { aantal: 1 }],
];

for (const [omschrijving, regel] of ongeldigeRegels) {
    test(`ongeldige regel (${omschrijving}) wordt geweigerd`, async ({ request }) => {
        const email = uniekEmail('ongeldig');
        const antwoord = await bestel(request, { naam: 'Test Klant', email, regels: [regel] });
        expect(antwoord.status()).toBe(422);
        expect((await antwoord.json()).fouten.mandje).toBe('Je mandje bevat een ongeldige regel.');
        expect(aantalBestellingenVoor(email)).toBe(0);
    });
}

test('meer dan 99 stuks per product wordt geweigerd, ook verdeeld over regels', async ({ request }) => {
    const email = uniekEmail('te-veel');
    const antwoord = await bestel(request, {
        naam: 'Test Klant', email,
        regels: [{ id: 'mok', aantal: 50 }, { id: 'mok', aantal: 50 }],
    });
    expect(antwoord.status()).toBe(422);
    expect((await antwoord.json()).fouten.mandje).toBe('Je kunt maximaal 99 stuks per product bestellen.');
    expect(aantalBestellingenVoor(email)).toBe(0);
});

test('meer dan 50 regels wordt geweigerd', async ({ request }) => {
    const email = uniekEmail('te-veel-regels');
    const regels = Array.from({ length: 51 }, () => ({ id: 'mok', aantal: 1 }));
    const antwoord = await bestel(request, { naam: 'Test Klant', email, regels });
    expect(antwoord.status()).toBe(422);
    expect((await antwoord.json()).fouten.mandje).toBe('Je mandje bevat te veel regels.');
});

test('dubbele regels voor hetzelfde product worden samengevoegd', async ({ request }) => {
    const email = uniekEmail('samenvoegen');
    const antwoord = await bestel(request, {
        naam: '  Test Klant  ', email,
        regels: [{ id: 'kaars', aantal: 1 }, { id: 'notitieboek', aantal: 1 }, { id: 'kaars', aantal: 2 }],
    });
    expect(antwoord.status()).toBe(201);
    const body = await antwoord.json();
    expect(body.totaal_cent).toBe(3 * 795 + 450);

    const bestelling = haalBestelling(body.bestelnummer);
    expect(bestelling.naam).toBe('Test Klant'); // spaties weggehaald
    expect(bestelling.regels).toEqual([
        { slug: 'kaars', product_naam: 'Geurkaars', prijs_cent: 795, aantal: 3, regel_totaal_cent: 2385 },
        { slug: 'notitieboek', product_naam: 'Notitieboek', prijs_cent: 450, aantal: 1, regel_totaal_cent: 450 },
    ]);
});

test('afgeschermde mappen zijn niet via de webserver op te vragen', async ({ request }) => {
    // De afscherming zit in .htaccess en werkt dus alleen onder Apache (niet met de PHP-server in CI)
    const server = (await request.get('./')).headers()['server'] ?? '';
    test.skip(!/apache/i.test(server), '.htaccess wordt alleen door Apache gebruikt');

    for (const pad of ['tests/db-helper.php', 'tests/bestellen.spec.js', 'database/schema.sql']) {
        const antwoord = await request.get(pad);
        expect(antwoord.status(), pad).toBe(403);
    }
});

test('config.php toont geen verbindingsgegevens', async ({ request }) => {
    // config.php geeft alleen een array terug en toont dus niets
    const config = await request.get('config.php');
    expect(await config.text()).toBe('');
});
