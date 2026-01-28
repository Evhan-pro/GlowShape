require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Admin, sequelize } = require('./models');

async function createAdmin() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Synchroniser les modèles
    await sequelize.sync();
    console.log('✅ Modèles synchronisés');

    // Vérifier si un admin existe déjà
    const existingAdmin = await Admin.findOne({ where: { email: 'admin@glowshape.fr' } });
    
    if (existingAdmin) {
      console.log('⚠️  Un admin avec cet email existe déjà');
      console.log('📧 Email: admin@glowshape.fr');
      console.log('🔑 Mot de passe: admin123');
      process.exit(0);
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Créer l'admin
    const admin = await Admin.create({
      email: 'admin@glowshape.fr',
      password_hash: passwordHash,
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin créé avec succès !');
    console.log('📧 Email: admin@glowshape.fr');
    console.log('🔑 Mot de passe: admin123');
    console.log('\n🎉 Vous pouvez maintenant vous connecter sur /admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createAdmin();
