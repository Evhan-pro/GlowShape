require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// PostgreSQL Connection
const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Models
const Prestation = sequelize.define('Prestation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  categorie: { type: DataTypes.STRING, allowNull: false },
  duree_minutes: { type: DataTypes.INTEGER, allowNull: false },
  prix_euros: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT
}, { tableName: 'prestations', timestamps: false });

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  prestation_id: { type: DataTypes.UUID, allowNull: false },
  prestation_nom: { type: DataTypes.STRING, allowNull: false },
  nom_client: { type: DataTypes.STRING, allowNull: false },
  email_client: { type: DataTypes.STRING, allowNull: false },
  telephone_client: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  heure_debut: { type: DataTypes.TIME, allowNull: false },
  heure_fin: { type: DataTypes.TIME, allowNull: false },
  statut: { type: DataTypes.STRING, defaultValue: 'confirmed' },
  google_event_id: DataTypes.STRING,
  // Champs paiement Stripe
  montant_total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  montant_acompte: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  statut_paiement: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, paid, failed, no_charge
  stripe_customer_id: DataTypes.STRING, // ID client Stripe
  stripe_setup_intent_id: DataTypes.STRING, // ID Setup Intent
  stripe_payment_method_id: DataTypes.STRING, // ID carte enregistrée
  stripe_payment_intent_id: DataTypes.STRING, // ID paiement
  stripe_charge_id: DataTypes.STRING,
  date_paiement: DataTypes.DATE,
  date_annulation: DataTypes.DATE,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'reservations', timestamps: false });

const Contact = sequelize.define('Contact', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  telephone: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  lu: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'contacts', timestamps: false });

const Horaires = sequelize.define('Horaires', {
  date: { type: DataTypes.DATEONLY, primaryKey: true },
  ouvert: { type: DataTypes.BOOLEAN, defaultValue: true },
  heure_ouverture: { type: DataTypes.TIME, defaultValue: '09:00' },
  heure_fermeture: { type: DataTypes.TIME, defaultValue: '19:00' },
  note: DataTypes.TEXT
}, { tableName: 'horaires_personnalises', timestamps: false });

const GoogleToken = sequelize.define('GoogleToken', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  access_token: DataTypes.TEXT,
  refresh_token: DataTypes.TEXT,
  token_type: DataTypes.STRING,
  expiry_date: DataTypes.BIGINT
}, { tableName: 'google_tokens', timestamps: false });

const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.TEXT, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'admin' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'admins', schema: 'public', timestamps: false });

const AvantApres = sequelize.define('AvantApres', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  titre: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  image_avant: { type: DataTypes.TEXT, allowNull: false },
  image_apres: { type: DataTypes.TEXT, allowNull: false },
  ordre: { type: DataTypes.INTEGER, defaultValue: 0 },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'avant_apres', timestamps: false });

const HomePageContent = sequelize.define('HomePageContent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  hero_titre: { type: DataTypes.STRING, defaultValue: "L'Élégance au Naturel" },
  hero_sous_titre: { type: DataTypes.TEXT, defaultValue: "Découvrez un havre de beauté et de bien-être où chaque soin est une expérience unique" },
  hero_image: { type: DataTypes.TEXT },
  about_titre: { type: DataTypes.STRING, defaultValue: "À Propos de Notre Institut" },
  about_texte: { type: DataTypes.TEXT },
  about_image: { type: DataTypes.TEXT },
  cta_titre: { type: DataTypes.STRING, defaultValue: "Prête à Vous Offrir un Moment de Bien-Être ?" },
  cta_texte: { type: DataTypes.TEXT }
}, { tableName: 'homepage_content', timestamps: false });

const Temoignage = sequelize.define('Temoignage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  texte: { type: DataTypes.TEXT, allowNull: false },
  note: { type: DataTypes.INTEGER, defaultValue: 5 },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  ordre: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'temoignages', timestamps: false });

const SiteSettings = sequelize.define('SiteSettings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  nom_institut: { type: DataTypes.STRING, defaultValue: "Glow & Shape" },
  adresse: { type: DataTypes.STRING, defaultValue: "123 Avenue de la Beauté" },
  ville: { type: DataTypes.STRING, defaultValue: "75001 Paris" },
  telephone: { type: DataTypes.STRING, defaultValue: "01 23 45 67 89" },
  email: { type: DataTypes.STRING, defaultValue: "contact@glowandshape.fr" },
  facebook_url: { type: DataTypes.STRING, defaultValue: "" },
  instagram_url: { type: DataTypes.STRING, defaultValue: "" },
  horaires_defaut: { type: DataTypes.JSONB }
}, { tableName: 'site_settings', timestamps: false });

// Seed
async function seedPrestations() {
  const count = await Prestation.count();
  if (count > 0) return;

  const prestations = [
    { nom: 'Soin du visage purifiant', categorie: 'Visage', duree_minutes: 60, prix_euros: 75, description: 'Nettoyage en profondeur, gommage et masque purifiant pour une peau éclatante.' },
    { nom: 'Soin anti-âge premium', categorie: 'Visage', duree_minutes: 90, prix_euros: 120, description: 'Protocole anti-rides avec sérums actifs et massage lifting.' },
    { nom: 'Soin hydratation intense', categorie: 'Visage', duree_minutes: 75, prix_euros: 85, description: 'Réhydratation profonde pour retrouver une peau souple et lumineuse.' },
    { nom: 'Gommage corps relaxant', categorie: 'Corps', duree_minutes: 45, prix_euros: 65, description: "Exfoliation douce suivie d'une application d'huile nourrissante." },
    { nom: 'Enveloppement minceur', categorie: 'Corps', duree_minutes: 90, prix_euros: 110, description: 'Soin sculptant avec enveloppement chauffant et massage drainant.' },
    { nom: 'Épilation jambes complètes', categorie: 'Épilation', duree_minutes: 45, prix_euros: 45, description: 'Épilation à la cire chaude pour une peau douce et nette.' },
    { nom: 'Épilation maillot intégral', categorie: 'Épilation', duree_minutes: 30, prix_euros: 35, description: 'Épilation précise et délicate.' },
    { nom: 'Épilation sourcils et lèvre', categorie: 'Épilation', duree_minutes: 20, prix_euros: 20, description: 'Sublimez votre regard avec une épilation soignée.' },
    { nom: 'Manucure classique', categorie: 'Ongles', duree_minutes: 45, prix_euros: 35, description: 'Soin des ongles, pose de vernis et massage des mains.' },
    { nom: 'Pose vernis semi-permanent', categorie: 'Ongles', duree_minutes: 60, prix_euros: 50, description: 'Manucure longue durée avec vernis gel tenue 3 semaines.' },
    { nom: 'Pédicure spa', categorie: 'Ongles', duree_minutes: 60, prix_euros: 45, description: 'Bain relaxant, soin des pieds et pose de vernis.' },
    { nom: 'Massage relaxant 60min', categorie: 'Massages', duree_minutes: 60, prix_euros: 70, description: 'Massage corps entier aux huiles essentielles pour une détente absolue.' },
    { nom: 'Massage dos et nuque', categorie: 'Massages', duree_minutes: 30, prix_euros: 40, description: 'Ciblé sur les tensions du haut du corps.' },
    { nom: 'Massage pierres chaudes', categorie: 'Massages', duree_minutes: 90, prix_euros: 95, description: 'Massage profond avec pierres volcaniques chauffées.' }
  ];

  await Prestation.bulkCreate(prestations);
  console.log('✓ Seeded', prestations.length, 'prestations');
}

async function initDatabase() {
  await sequelize.sync({ alter: true });
  console.log('✓ Database synced');
  await seedPrestations();
}

module.exports = {
  sequelize,
  initDatabase,
  Prestation,
  Reservation,
  Contact,
  Horaires,
  GoogleToken,
  Admin,
  AvantApres,
  HomePageContent,
  Temoignage,
  SiteSettings
};
