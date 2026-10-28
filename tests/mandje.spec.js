// @ts-check
const { test, expect } = require('@playwright/test');

// Vaste verwachtingen, berekend uit de productgegevens in database/schema.sql:
// kaars 795 cent, mok 995 cent.
// 2 × 795 + 995 = 2585 cent → € 25,85
// 2 × 795       = 1590 cent → € 15,90
const TOTAAL_MET_MOK = '€ 25,85';
const TOTAAL_ZONDER_MOK = '€ 15,90';

test('mandje: toevoegen, bewaren na verversen en verwijderen', async ({ page }) => {
    await page.goto('./');

    const mandjeLeeg = page.locator('#mandje-leeg');
    const tabel = page.locator('#mandje-tabel');
    const teller = page.locator('#mandje-aantal');
    const totaal = page.locator('#mandje-totaal');
    const regel = (naam) => page.locator('#mandje-regels tr', { hasText: naam });
    const inMandje = (naam) =>
        page.locator('.product-kaart', { hasText: naam }).getByRole('button');

    // Begin met een leeg mandje
    await expect(mandjeLeeg).toBeVisible();
    await expect(tabel).toBeHidden();
    await expect(teller).toHaveText('0');

    // Twee kaarsen en één mok toevoegen
    await inMandje('Geurkaars').click();
    await inMandje('Geurkaars').click();
    await inMandje('Mok').click();

    await expect(mandjeLeeg).toBeHidden();
    await expect(page.locator('#mandje-regels tr')).toHaveCount(2);
    await expect(regel('Geurkaars').locator('.aantal-getal')).toHaveText('2');
    await expect(regel('Mok').locator('.aantal-getal')).toHaveText('1');
    await expect(teller).toHaveText('3');
    await expect(totaal).toHaveText(TOTAAL_MET_MOK);

    // Verversen: het mandje moet behouden blijven
    await page.reload();

    await expect(page.locator('#mandje-regels tr')).toHaveCount(2);
    await expect(regel('Geurkaars').locator('.aantal-getal')).toHaveText('2');
    await expect(regel('Mok').locator('.aantal-getal')).toHaveText('1');
    await expect(teller).toHaveText('3');
    await expect(totaal).toHaveText(TOTAAL_MET_MOK);

    // De mok verwijderen
    await regel('Mok').getByRole('button', { name: 'Mok verwijderen' }).click();

    await expect(regel('Mok')).toHaveCount(0);
    await expect(page.locator('#mandje-regels tr')).toHaveCount(1);
    await expect(regel('Geurkaars').locator('.aantal-getal')).toHaveText('2');
    await expect(teller).toHaveText('2');
    await expect(totaal).toHaveText(TOTAAL_ZONDER_MOK);
});

test('mandje: aantal verhogen en verlagen met + en −', async ({ page }) => {
    await page.goto('./');
    await page.locator('.product-kaart', { hasText: 'Geurkaars' }).getByRole('button').click();

    const regel = page.locator('#mandje-regels tr', { hasText: 'Geurkaars' });
    const min = regel.getByRole('button', { name: 'Eén Geurkaars minder' });
    const plus = regel.getByRole('button', { name: 'Eén Geurkaars meer' });

    // Bij 1 stuk kan het aantal niet lager
    await expect(regel.locator('.aantal-getal')).toHaveText('1');
    await expect(min).toBeDisabled();

    await plus.click();
    await plus.click();
    await expect(regel.locator('.aantal-getal')).toHaveText('3');
    await expect(min).toBeEnabled();
    await expect(page.locator('#mandje-aantal')).toHaveText('3');
    await expect(page.locator('#mandje-totaal')).toHaveText('€ 23,85'); // 3 × 795

    await min.click();
    await expect(regel.locator('.aantal-getal')).toHaveText('2');
    await expect(page.locator('#mandje-totaal')).toHaveText('€ 15,90');
});

test('mandje: knop toont kort "Toegevoegd ✓"', async ({ page }) => {
    await page.goto('./');
    const knop = page.locator('.product-kaart', { hasText: 'Mok' }).getByRole('button');

    await knop.click();
    await expect(knop).toHaveText('Toegevoegd ✓');
    await expect(knop).toHaveText('In mandje', { timeout: 3000 });
});

test('mandje: maximaal 99 stuks per product', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('cadeauwinkel-mandje', JSON.stringify({ kaars: 150 }));
    });
    await page.goto('./');

    const regel = page.locator('#mandje-regels tr', { hasText: 'Geurkaars' });
    await expect(regel.locator('.aantal-getal')).toHaveText('99');
    await expect(regel.getByRole('button', { name: 'Eén Geurkaars meer' })).toBeDisabled();

    // Nog een keer op "In mandje" klikken verhoogt niet boven de 99
    await page.locator('.product-kaart', { hasText: 'Geurkaars' }).getByRole('button').click();
    await expect(regel.locator('.aantal-getal')).toHaveText('99');
    await expect(page.locator('#mandje-aantal')).toHaveText('99');
});

test('mandje: ongeldige gegevens in localStorage worden genegeerd', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('cadeauwinkel-mandje', JSON.stringify({
            onbekend: 3,      // bestaat niet
            kaars: '2',       // geen getal
            mok: 2.5,         // geen geheel getal
            notitieboek: 2,   // geldig
        }));
    });
    await page.goto('./');

    await expect(page.locator('#mandje-regels tr')).toHaveCount(1);
    await expect(page.locator('#mandje-regels tr', { hasText: 'Notitieboek' }).locator('.aantal-getal'))
        .toHaveText('2');
    await expect(page.locator('#mandje-aantal')).toHaveText('2');
});

test('mandje: kapotte JSON in localStorage geeft een leeg mandje', async ({ page }) => {
    const fouten = [];
    page.on('pageerror', (fout) => fouten.push(fout));
    await page.addInitScript(() => {
        localStorage.setItem('cadeauwinkel-mandje', '{dit is geen json');
    });
    await page.goto('./');

    await expect(page.locator('#mandje-leeg')).toBeVisible();
    await expect(page.locator('#mandje-aantal')).toHaveText('0');
    expect(fouten).toEqual([]);
});

test('mandje: wijzigingen in een ander tabblad worden overgenomen', async ({ context }) => {
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();
    await tab1.goto('./');
    await tab2.goto('./');

    await tab1.locator('.product-kaart', { hasText: 'Mok' }).getByRole('button').click();

    await expect(tab2.locator('#mandje-aantal')).toHaveText('1');
    await expect(tab2.locator('#mandje-regels tr', { hasText: 'Mok' })).toHaveCount(1);
});
