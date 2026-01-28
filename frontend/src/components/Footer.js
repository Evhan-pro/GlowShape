import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatHoraires = () => {
    if (!settings?.horaires_defaut) {
      return { jours: 'Lundi - Samedi', heures: '9h00 - 19h00' };
    }

    const h = settings.horaires_defaut;
    const joursOuverts = [];
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const nomsJours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    let debut = null;
    let fin = null;
    let heuresRef = null;

    jours.forEach((jour, i) => {
      const info = h[jour];
      if (info?.ouvert) {
        const heures = `${info.ouverture} - ${info.fermeture}`;
        if (debut === null) {
          debut = i;
          heuresRef = heures;
        }
        fin = i;
      }
    });

    if (debut !== null && fin !== null) {
      const joursTexte = debut === fin 
        ? nomsJours[debut]
        : `${nomsJours[debut]} - ${nomsJours[fin]}`;
      
      const premierJourOuvert = h[jours[debut]];
      const heuresTexte = premierJourOuvert 
        ? `${premierJourOuvert.ouverture.replace(':', 'h')} - ${premierJourOuvert.fermeture.replace(':', 'h')}`
        : '9h00 - 19h00';

      return { jours: joursTexte, heures: heuresTexte };
    }

    return { jours: 'Lundi - Samedi', heures: '9h00 - 19h00' };
  };

  const horaires = formatHoraires();

  return (
    <footer data-testid="footer" className="bg-primary text-primary-foreground py-8 sm:py-12 md:py-16">
      <div className="container-custom px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
          {/* Coordonnées */}
          <div data-testid="footer-contact-section">
            <h3 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">{settings?.nom_institut || 'Institut'}</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-accent mt-1 flex-shrink-0" />
                <p className="text-xs sm:text-sm">
                  {settings?.adresse || '123 Avenue de la Beauté'}<br />
                  {settings?.ville || '75001 Paris'}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Phone size={18} className="text-accent mt-1 flex-shrink-0" />
                <p className="text-xs sm:text-sm">{settings?.telephone || '01 23 45 67 89'}</p>
              </div>
              <div className="flex items-start space-x-3">
                <Mail size={18} className="text-accent mt-1 flex-shrink-0" />
                <p className="text-xs sm:text-sm break-all">{settings?.email || 'contact@institut.fr'}</p>
              </div>
              <div className="flex items-start space-x-3">
                <Clock size={18} className="text-accent mt-1 flex-shrink-0" />
                <div className="text-xs sm:text-sm">
                  <p>{horaires.jours}</p>
                  <p>{horaires.heures}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Liens rapides */}
          <div data-testid="footer-links-section">
            <h3 className="text-lg sm:text-xl font-serif mb-4 sm:mb-6">Liens rapides</h3>
            <div className="space-y-2 sm:space-y-3">
              <Link to="/" className="block text-xs sm:text-sm hover:text-accent transition-colors">
                Accueil
              </Link>
              <Link to="/prestations" className="block text-xs sm:text-sm hover:text-accent transition-colors">
                Nos prestations
              </Link>
              <Link to="/avant-apres" className="block text-xs sm:text-sm hover:text-accent transition-colors">
                Avant/Après
              </Link>
              <Link to="/contact" className="block text-xs sm:text-sm hover:text-accent transition-colors">
                Contact
              </Link>
              <Link to="/reservation" className="block text-xs sm:text-sm hover:text-accent transition-colors">
                Réserver en ligne
              </Link>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div data-testid="footer-social-section" className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-serif mb-4 sm:mb-6">Suivez-nous</h3>
            <div className="flex space-x-3 sm:space-x-4">
              {settings?.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="social-link-facebook"
                  className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Facebook size={18} />
                </a>
              )}
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="social-link-instagram"
                  className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Instagram size={18} />
                </a>
              )}
              {!settings?.facebook_url && !settings?.instagram_url && (
                <>
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                    <Facebook size={18} />
                  </div>
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                    <Instagram size={18} />
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              Découvrez nos actualités et nos conseils beauté sur nos réseaux sociaux.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-secondary/30 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings?.nom_institut || 'Institut'}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
