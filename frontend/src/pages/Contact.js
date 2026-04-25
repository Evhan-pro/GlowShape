import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ nom: '', email: '', telephone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [pageContent, setPageContent] = useState({});

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-settings`)
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/page-content/contact`)
      .then(r => r.json())
      .then(data => setPageContent(data || {}))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.detail || "Erreur lors de l'envoi");
      }
      setSuccess(true);
      setFormData({ nom: '', email: '', telephone: '', message: '' });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const formatHoraires = () => {
    if (!settings?.horaires_defaut) return null;
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
  const mapQuery = settings?.adresse ? encodeURIComponent(`${settings.adresse}, ${settings.ville || ''}`) : null;

  return (
    <div data-testid="contact-page" className="min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="container-custom px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          {pageContent.titre && (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif mb-4">{pageContent.titre}</h1>
          )}
          {pageContent.sous_titre && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto whitespace-pre-line">
              {pageContent.sous_titre}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Formulaire */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-sm p-6 sm:p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg sm:text-xl font-serif mb-2">{pageContent.succes_titre || 'Message envoyé !'}</h3>
                <p className="text-sm text-muted-foreground mb-4">{pageContent.succes_texte || 'Nous vous répondrons dans les plus brefs délais.'}</p>
                <button onClick={() => setSuccess(false)} className="text-accent hover:underline text-sm">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} data-testid="contact-form" className="bg-white border border-border rounded-sm p-5 sm:p-8 space-y-4 sm:space-y-5">
                {pageContent.form_titre && (
                  <h2 className="text-xl sm:text-2xl font-serif mb-2">{pageContent.form_titre}</h2>
                )}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Nom complet</label>
                  <input data-testid="contact-nom" type="text" required value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 border border-input rounded-sm text-sm focus:outline-none focus:border-accent" placeholder="Votre nom" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Email</label>
                  <input data-testid="contact-email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 border border-input rounded-sm text-sm focus:outline-none focus:border-accent" placeholder="votre@email.com" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Téléphone</label>
                  <input data-testid="contact-telephone" type="tel" required value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 border border-input rounded-sm text-sm focus:outline-none focus:border-accent" placeholder="06 12 34 56 78" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">Message</label>
                  <textarea data-testid="contact-message" required rows={4} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 border border-input rounded-sm text-sm focus:outline-none focus:border-accent resize-none" placeholder="Votre message..." />
                </div>
                {error && <p data-testid="contact-error" className="text-red-600 text-xs sm:text-sm">{error}</p>}
                <button data-testid="contact-submit" type="submit" disabled={loading}
                  className="w-full btn-primary px-6 py-3 bg-accent text-accent-foreground rounded-sm font-medium disabled:opacity-50 flex items-center justify-center space-x-2">
                  <Send size={18} />
                  <span>{loading ? 'Envoi en cours...' : 'Envoyer'}</span>
                </button>
              </form>
            )}
          </motion.div>

          {/* Infos + Carte */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
            <div className="bg-white border border-border rounded-sm p-5 sm:p-8 space-y-4 sm:space-y-5">
              {pageContent.infos_titre && (
                <h2 className="text-xl sm:text-2xl font-serif mb-2">{pageContent.infos_titre}</h2>
              )}
              {settings?.adresse && (
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{settings.adresse}</p>
                    {settings.ville && <p className="text-muted-foreground text-xs sm:text-sm">{settings.ville}</p>}
                  </div>
                </div>
              )}
              {settings?.telephone && (
                <div className="flex items-start space-x-3">
                  <Phone size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{settings.telephone}</p>
                </div>
              )}
              {settings?.email && (
                <div className="flex items-start space-x-3">
                  <Mail size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm break-all">{settings.email}</p>
                </div>
              )}
              {horaires && (
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Horaires d'ouverture</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">{horaires.jours} : {horaires.heures}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Carte interactive */}
            {mapQuery && (
              <div data-testid="contact-map" className="bg-white border border-border rounded-sm overflow-hidden">
                <iframe
                  title="Localisation de l'institut"
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${mapQuery}&zoom=15`}
                  allowFullScreen
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
