-- ============================================
-- Glow & Shape - Schema BDD complet
-- Version avec paiement differe Stripe
-- ============================================

-- Nettoyage
DROP TABLE IF EXISTS avant_apres CASCADE;
DROP TABLE IF EXISTS temoignages CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS homepage_content CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS google_tokens CASCADE;
DROP TABLE IF EXISTS horaires_personnalises CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS prestations CASCADE;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE prestations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(255) NOT NULL,
    duree_minutes INTEGER NOT NULL,
    prix_euros NUMERIC(10,2) NOT NULL,
    description TEXT
);

CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prestation_id UUID NOT NULL REFERENCES prestations(id) ON DELETE CASCADE,
    prestation_nom VARCHAR(255) NOT NULL,
    nom_client VARCHAR(255) NOT NULL,
    email_client VARCHAR(255) NOT NULL,
    telephone_client VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    statut VARCHAR(255) DEFAULT 'confirmed',
    google_event_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Colonnes paiement Stripe
    montant_total NUMERIC(10,2) DEFAULT 0,
    montant_acompte NUMERIC(10,2) DEFAULT 0,
    statut_paiement VARCHAR(255) DEFAULT 'pending',
    stripe_customer_id VARCHAR(255),
    stripe_setup_intent_id VARCHAR(255),
    stripe_payment_method_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    date_paiement TIMESTAMPTZ,
    date_annulation TIMESTAMPTZ
);

CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE horaires_personnalises (
    date DATE PRIMARY KEY,
    ouvert BOOLEAN DEFAULT TRUE,
    heure_ouverture TIME DEFAULT '09:00',
    heure_fermeture TIME DEFAULT '19:00',
    note TEXT
);

CREATE TABLE google_tokens (
    id SERIAL PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    token_type VARCHAR(255),
    expiry_date BIGINT
);

CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(255) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE homepage_content (
    id INTEGER DEFAULT 1 PRIMARY KEY,
    hero_titre VARCHAR(255) DEFAULT 'L''Elegance au Naturel',
    hero_sous_titre TEXT DEFAULT 'Decouvrez un havre de beaute et de bien-etre ou chaque soin est une experience unique',
    hero_image TEXT,
    about_titre VARCHAR(255) DEFAULT 'A Propos de Notre Institut',
    about_texte TEXT,
    about_image TEXT,
    cta_titre VARCHAR(255) DEFAULT 'Prete a Vous Offrir un Moment de Bien-Etre ?',
    cta_texte TEXT
);

CREATE TABLE temoignages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    texte TEXT NOT NULL,
    note INTEGER DEFAULT 5,
    actif BOOLEAN DEFAULT TRUE,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE site_settings (
    id INTEGER DEFAULT 1 PRIMARY KEY,
    nom_institut VARCHAR(255) DEFAULT 'Glow & Shape',
    adresse VARCHAR(255) DEFAULT '123 Avenue de la Beaute',
    ville VARCHAR(255) DEFAULT '75001 Paris',
    telephone VARCHAR(255) DEFAULT '01 23 45 67 89',
    email VARCHAR(255) DEFAULT 'contact@glowandshape.fr',
    facebook_url VARCHAR(255) DEFAULT '',
    instagram_url VARCHAR(255) DEFAULT '',
    horaires_defaut JSONB
);

CREATE TABLE avant_apres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    image_avant TEXT NOT NULL,
    image_apres TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_statut ON reservations(statut);
CREATE INDEX idx_reservations_email ON reservations(email_client);
CREATE INDEX idx_prestations_categorie ON prestations(categorie);
CREATE INDEX idx_contacts_lu ON contacts(lu);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX idx_horaires_date ON horaires_personnalises(date);

-- ============================================
-- FONCTION : verification creneau disponible
-- ============================================

CREATE OR REPLACE FUNCTION check_creneau_disponible(
    p_date DATE,
    p_heure_debut TIME,
    p_heure_fin TIME
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM reservations
    WHERE date = p_date
      AND statut = 'confirmed'
      AND (heure_debut < p_heure_fin AND heure_fin > p_heure_debut);
    RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONNEES INITIALES : Prestations
-- ============================================

INSERT INTO prestations (id, nom, categorie, duree_minutes, prix_euros, description) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Soin du visage purifiant', 'Visage', 60, 75.00, 'Nettoyage en profondeur, gommage et masque purifiant pour une peau eclatante.'),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Soin anti-age premium', 'Visage', 90, 120.00, 'Protocole anti-rides avec serums actifs et massage lifting.'),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Soin hydratation intense', 'Visage', 75, 85.00, 'Rehydratation profonde pour retrouver une peau souple et lumineuse.'),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Gommage corps relaxant', 'Corps', 45, 65.00, 'Exfoliation douce suivie d''une application d''huile nourrissante.'),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Enveloppement minceur', 'Corps', 90, 110.00, 'Soin sculptant avec enveloppement chauffant et massage drainant.'),
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Epilation jambes completes', 'Epilation', 45, 45.00, 'Epilation a la cire chaude pour une peau douce et nette.'),
('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Epilation maillot integral', 'Epilation', 30, 35.00, 'Epilation precise et delicate.'),
('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Epilation sourcils et levre', 'Epilation', 20, 20.00, 'Sublimez votre regard avec une epilation soignee.'),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Manucure classique', 'Ongles', 45, 35.00, 'Soin des ongles, pose de vernis et massage des mains.'),
('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Pose vernis semi-permanent', 'Ongles', 60, 50.00, 'Manucure longue duree avec vernis gel tenue 3 semaines.'),
('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'Pedicure spa', 'Ongles', 60, 45.00, 'Bain relaxant, soin des pieds et pose de vernis.'),
('f2a3b4c5-d6e7-4f5a-9b0c-1d2e3f4a5b6c', 'Massage relaxant 60min', 'Massages', 60, 70.00, 'Massage corps entier aux huiles essentielles pour une detente absolue.'),
('a3b4c5d6-e7f8-4a5b-0c1d-2e3f4a5b6c7d', 'Massage dos et nuque', 'Massages', 30, 40.00, 'Cible sur les tensions du haut du corps.'),
('b4c5d6e7-f8a9-4b5c-1d2e-3f4a5b6c7d8e', 'Massage pierres chaudes', 'Massages', 90, 95.00, 'Massage profond avec pierres volcaniques chauffees.');

-- ============================================
-- DONNEES INITIALES : Homepage, Settings
-- ============================================

INSERT INTO homepage_content (id) VALUES (1);
INSERT INTO site_settings (id) VALUES (1);
