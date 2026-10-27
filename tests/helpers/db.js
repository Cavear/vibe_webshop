// Leest bestellingen uit de database via tests/db-helper.php (PHP-CLI).
// Pad naar PHP aanpasbaar met de omgevingsvariabele PHP_BIN.
const { execFileSync } = require('child_process');
const path = require('path');

const PHP_BIN = process.env.PHP_BIN || 'C:\\xampp\\php\\php.exe';
const HELPER = path.join(__dirname, '..', 'db-helper.php');

function vraag(actie, waarde) {
    const uitvoer = execFileSync(PHP_BIN, [HELPER, actie, waarde], { encoding: 'utf8' });
    return JSON.parse(uitvoer);
}

module.exports = {
    haalBestelling: (bestelnummer) => vraag('bestelling', bestelnummer),
    aantalBestellingenVoor: (email) => vraag('aantal-voor-email', email),
};
