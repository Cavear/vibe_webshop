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
