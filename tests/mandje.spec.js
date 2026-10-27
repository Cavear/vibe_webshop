// @ts-check
const { test, expect } = require('@playwright/test');

// Vaste verwachtingen, berekend uit de productgegevens in index.php:
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
