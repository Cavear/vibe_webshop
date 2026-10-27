// Winkelmandje: bewaard in localStorage als { productId: aantal }.
// Alle bedragen worden in hele centen gerekend.
(function () {
    'use strict';

    var OPSLAG_SLEUTEL = 'cadeauwinkel-mandje';
    var MAX_AANTAL = 99;

    var euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

    function formatEuro(cent) {
        return euro.format(cent / 100);
    }

    // ===== Productgegevens uit de "In mandje"-knoppen halen =====
    var knoppen = document.querySelectorAll('[data-product-id]');
    var producten = {};
    knoppen.forEach(function (knop) {
        producten[knop.dataset.productId] = {
            naam: knop.dataset.naam,
            prijsCent: parseInt(knop.dataset.prijsCent, 10)
        };
    });

    // ===== Opslag =====
    function laadMandje() {
        var mandje = {};
        var data;
        try {
            data = JSON.parse(localStorage.getItem(OPSLAG_SLEUTEL));
        } catch (e) {
            data = null;
        }
        if (!data || typeof data !== 'object') {
            return mandje;
        }
        // Alleen bekende producten met een geldig aantal overnemen
        Object.keys(data).forEach(function (id) {
            var aantal = data[id];
            if (producten[id] && Number.isInteger(aantal) && aantal > 0) {
                mandje[id] = Math.min(aantal, MAX_AANTAL);
            }
        });
        return mandje;
    }

    function bewaarMandje(mandje) {
        try {
            localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(mandje));
        } catch (e) {
            // Opslag niet beschikbaar (bijv. privévenster): mandje werkt dan alleen tot herladen
        }
    }

    var mandje = laadMandje();

    // ===== Acties =====
    function voegToe(id) {
        mandje[id] = Math.min((mandje[id] || 0) + 1, MAX_AANTAL);
        wijzig();
    }

    function zetAantal(id, aantal) {
        if (aantal < 1) {
            delete mandje[id];
        } else {
            mandje[id] = Math.min(aantal, MAX_AANTAL);
        }
        wijzig();
    }

    function verwijder(id) {
        delete mandje[id];
        wijzig();
    }

    function wijzig() {
        bewaarMandje(mandje);
        toonMandje();
    }

    // ===== Weergave =====
    var elAantal = document.getElementById('mandje-aantal');
    var elLeeg = document.getElementById('mandje-leeg');
    var elTabel = document.getElementById('mandje-tabel');
    var elRegels = document.getElementById('mandje-regels');
    var elTotaal = document.getElementById('mandje-totaal');

    function maakKnop(tekst, actie, id, label) {
        var knop = document.createElement('button');
        knop.type = 'button';
        knop.className = 'knop-klein';
        knop.textContent = tekst;
        knop.dataset.actie = actie;
        knop.dataset.id = id;
        knop.setAttribute('aria-label', label);
        return knop;
    }

    function maakCel(inhoud) {
        var cel = document.createElement('td');
        if (typeof inhoud === 'string') {
            cel.textContent = inhoud;
        } else {
            cel.appendChild(inhoud);
        }
        return cel;
    }

    function toonMandje() {
        var ids = Object.keys(mandje);
        var totaalCent = 0;
        var totaalStuks = 0;

        elRegels.textContent = '';

        ids.forEach(function (id) {
            var product = producten[id];
            var aantal = mandje[id];
            var regelCent = product.prijsCent * aantal;
            totaalCent += regelCent;
            totaalStuks += aantal;

            var aantalBlok = document.createElement('div');
            aantalBlok.className = 'aantal';
            var min = maakKnop('−', 'min', id, 'Eén ' + product.naam + ' minder');
            min.disabled = aantal <= 1;
            var plus = maakKnop('+', 'plus', id, 'Eén ' + product.naam + ' meer');
            plus.disabled = aantal >= MAX_AANTAL;
            var getal = document.createElement('span');
            getal.className = 'aantal-getal';
            getal.textContent = aantal;
            aantalBlok.append(min, getal, plus);

            var prijsCel = maakCel(formatEuro(product.prijsCent));
            prijsCel.className = 'kolom-prijs';

            // Op smalle schermen toont de CSS alleen het kruisje
            var verwijderKnop = maakKnop('', 'verwijder', id, product.naam + ' verwijderen');
            verwijderKnop.innerHTML = '<span class="verwijder-tekst">Verwijderen</span>'
                + '<span class="verwijder-icoon" aria-hidden="true">✕</span>';

            var rij = document.createElement('tr');
            rij.append(
                maakCel(product.naam),
                prijsCel,
                maakCel(aantalBlok),
                maakCel(formatEuro(regelCent)),
                maakCel(verwijderKnop)
            );
            elRegels.appendChild(rij);
        });

        elTotaal.textContent = formatEuro(totaalCent);
        elAantal.textContent = totaalStuks;

        var leeg = ids.length === 0;
        elLeeg.hidden = !leeg;
        elTabel.hidden = leeg;
    }

    // ===== Gebeurtenissen =====
    knoppen.forEach(function (knop) {
        knop.addEventListener('click', function () {
            voegToe(knop.dataset.productId);
            knop.textContent = 'Toegevoegd ✓';
            setTimeout(function () {
                knop.textContent = 'In mandje';
            }, 1000);
        });
    });

    elRegels.addEventListener('click', function (e) {
        var knop = e.target.closest('button[data-actie]');
        if (!knop) {
            return;
        }
        var id = knop.dataset.id;
        if (knop.dataset.actie === 'plus') {
            zetAantal(id, mandje[id] + 1);
        } else if (knop.dataset.actie === 'min') {
            zetAantal(id, mandje[id] - 1);
        } else if (knop.dataset.actie === 'verwijder') {
            verwijder(id);
        }
    });

    // Mandje gelijk houden als het in een ander tabblad verandert
    window.addEventListener('storage', function (e) {
        if (e.key === OPSLAG_SLEUTEL) {
            mandje = laadMandje();
            toonMandje();
        }
    });

    toonMandje();
})();
