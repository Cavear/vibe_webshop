-- Schema en startdata voor de cadeauwebshop.
--
-- Herhaalbaar: dit bestand kan zo vaak als nodig worden uitgevoerd.
-- De tabel wordt alleen aangemaakt als hij nog niet bestaat, en de
-- startproducten worden op basis van hun slug bijgewerkt in plaats van
-- dubbel toegevoegd. Er wordt niets verwijderd.
--
-- Uitvoeren (vanuit de projectmap):
--   C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 vibe_webshop < database\schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS producten (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug         VARCHAR(50)  NOT NULL,              -- vaste identifier, gebruikt door het winkelmandje
    naam         VARCHAR(100) NOT NULL,
    beschrijving VARCHAR(255) NOT NULL DEFAULT '',
    prijs_cent   INT UNSIGNED NOT NULL,              -- prijs in hele centen
    icoon        VARCHAR(16)  NOT NULL DEFAULT '',
    sortering    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_producten_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO producten (slug, naam, beschrijving, prijs_cent, icoon, sortering) VALUES
    ('kaars',       'Geurkaars',   'Een zachte vanillegeur voor gezellige avonden.',     795, '🕯️', 10),
    ('notitieboek', 'Notitieboek', 'Handzaam boekje voor ideeën, lijstjes en krabbels.', 450, '📓', 20),
    ('mok',         'Mok',         'Stevige keramische mok voor koffie of thee.',        995, '☕', 30)
ON DUPLICATE KEY UPDATE
    naam         = VALUES(naam),
    beschrijving = VALUES(beschrijving),
    prijs_cent   = VALUES(prijs_cent),
    icoon        = VALUES(icoon),
    sortering    = VALUES(sortering);

-- Bestellingen. Er is nog geen betaalprovider: elke bestelling is een testbestelling.
CREATE TABLE IF NOT EXISTS bestellingen (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    bestelnummer  VARCHAR(20)  NULL,                 -- wordt direct na het invoegen gezet (o.b.v. id)
    naam          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    totaal_cent   INT UNSIGNED NOT NULL,             -- door de server berekend
    status        VARCHAR(20)  NOT NULL DEFAULT 'test',
    aangemaakt_op DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_bestellingen_bestelnummer (bestelnummer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bestelregels. Naam en prijs worden vastgelegd zoals ze op het moment van bestellen waren.
CREATE TABLE IF NOT EXISTS bestelregels (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    bestelling_id     INT UNSIGNED NOT NULL,
    product_id        INT UNSIGNED NOT NULL,
    product_naam      VARCHAR(100) NOT NULL,
    prijs_cent        INT UNSIGNED NOT NULL,
    aantal            INT UNSIGNED NOT NULL,
    regel_totaal_cent INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_bestelregels_bestelling (bestelling_id),
    CONSTRAINT fk_bestelregels_bestelling FOREIGN KEY (bestelling_id) REFERENCES bestellingen (id),
    CONSTRAINT fk_bestelregels_product    FOREIGN KEY (product_id)    REFERENCES producten (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
