// Zoekveld op de productpagina: verbergt producten waarvan naam en beschrijving de zoektekst niet bevatten.
(function () {
    'use strict';

    var veld = document.getElementById('zoek-product');
    var geenResultaat = document.getElementById('zoek-geen-resultaat');
    if (!veld) {
        return;
    }
    var kaarten = document.querySelectorAll('.product-kaart');

    veld.addEventListener('input', function () {
        var zoek = veld.value.trim().toLowerCase();
        var zichtbaar = 0;
        kaarten.forEach(function (kaart) {
            var past = zoek === '' || kaart.textContent.toLowerCase().indexOf(zoek) !== -1;
            kaart.hidden = !past;
            if (past) {
                zichtbaar += 1;
            }
        });
        geenResultaat.hidden = zichtbaar > 0;
    });
})();
