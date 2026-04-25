import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

const TikTokIcon = ({ size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.12z"/>
  </svg>
);

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-settings`)
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  if (!settings) return null;

  const formatHoraires = () => {
    if (!settings.horaires_defaut) return null;
    const h = settings.horaires_defaut;
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const noms = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    let debut = null, fin = null;
    jours.forEach((jour, i) => { if (h[jour]?.ouvert) { if (debut === null) debut = i; fin = i; } });
    if (debut !== null && fin !== null) {
      const j = debut === fin ? noms[debut] : `${noms[debut]} - ${noms[fin]}`;
      const p = h[jours[debut]];
      const hr = p ? `${p.ouverture.replace(':', 'h')} - ${p.fermeture.replace(':', 'h')}` : null;
      return { jours: j, heures: hr };
    }
    return null;
  };

  const horaires = formatHoraires();

  return (
    <footer data-testid="footer" className="bg-primary py-8 sm:py-12 md:py-16">
      <div className="container-custom px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
          {/* Coordonnées */}
          <div data-testid="footer-contact-section">
            {settings.nom_institut && (
              <h3 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6 text-white">{settings.nom_institut}</h3>
            )}
            <div className="space-y-3 sm:space-y-4">
              {(settings.adresse || settings.ville) && (
                <div className="flex items-start space-x-3">
                  <MapPin size={18} className="text-accent mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-white">
                    {settings.adresse && <>{settings.adresse}<br /></>}
                    {settings.ville}
                  </p>
                </div>
              )}
              {settings.telephone && (
                <div className="flex items-start space-x-3">
                  <Phone size={18} className="text-accent mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-white">{settings.telephone}</p>
                </div>
              )}
              {settings.email && (
                <div className="flex items-start space-x-3">
                  <Mail size={18} className="text-accent mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-white break-all">{settings.email}</p>
                </div>
              )}
              {horaires && (
                <div className="flex items-start space-x-3">
                  <Clock size={18} className="text-accent mt-1 flex-shrink-0" />
                  <div className="text-xs sm:text-sm text-white">
                    <p>{horaires.jours}</p>
                    {horaires.heures && <p>{horaires.heures}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liens rapides */}
          <div data-testid="footer-links-section">
            <h3 className="text-lg sm:text-xl font-serif mb-4 sm:mb-6 text-white">Liens rapides</h3>
            <div className="space-y-2 sm:space-y-3">
              <Link to="/" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Accueil</Link>
              <Link to="/prestations" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Nos prestations</Link>
              <Link to="/avant-apres" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Avant/Après</Link>
              <Link to="/contact" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Contact</Link>
              <Link to="/reservation" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Réserver en ligne</Link>
              <Link to="/cgu" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Conditions Générales d'Utilisation</Link>
              <Link to="/cgv" className="block text-xs sm:text-sm text-white/80 hover:text-white hover:font-semibold transition-all">Conditions Générales de Vente</Link>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div data-testid="footer-social-section" className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-serif mb-4 sm:mb-6 text-white">Suivez-nous</h3>
            <div className="flex space-x-3 sm:space-x-4">
              {settings.facebook_url ? (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" data-testid="social-link-facebook"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-white">
                  <Facebook size={18} />
                </a>
              ) : (
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"><Facebook size={18} /></div>
              )}
              {settings.instagram_url ? (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" data-testid="social-link-instagram"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-white">
                  <Instagram size={18} />
                </a>
              ) : (
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"><Instagram size={18} /></div>
              )}
              {settings.tiktok_url ? (
                <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" data-testid="social-link-tiktok"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-white">
                  <TikTokIcon size={18} />
                </a>
              ) : (
                <div data-testid="social-link-tiktok" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"><TikTokIcon size={18} /></div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20 text-center">
          <p className="text-xs sm:text-sm text-white/60">
            &copy; {new Date().getFullYear()} {settings.nom_institut}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
