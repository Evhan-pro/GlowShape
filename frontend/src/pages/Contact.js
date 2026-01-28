import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Votre message a été envoyé avec succès !' });
        setFormData({ nom: '', email: '', telephone: '', message: '' });
      } else {
        setSubmitStatus({ type: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="contact-page" className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="container-custom text-center px-4">
          <motion.h1 {...fadeInUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-4">
            Contactez-nous
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto"
          >
            Nous sommes à votre écoute pour répondre à toutes vos questions
          </motion.p>
        </div>
      </section>

      <div className="container-custom py-8 sm:py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Informations de contact */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl font-serif mb-6 sm:mb-8">Nos Coordonnées</h2>
            
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <div data-testid="contact-address" className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-sm sm:text-base">Adresse</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">123 Avenue de la Beauté<br />75001 Paris</p>
                </div>
              </div>

              <div data-testid="contact-phone" className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-sm sm:text-base">Téléphone</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">01 23 45 67 89</p>
                </div>
              </div>

              <div data-testid="contact-email" className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-sm sm:text-base">Email</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm break-all">contact@institut.fr</p>
                </div>
              </div>

              <div data-testid="contact-hours" className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-sm sm:text-base">Horaires</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Lundi - Samedi : 9h00 - 19h00<br />Dimanche : Fermé</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div data-testid="map-container" className="bg-secondary/30 rounded-sm h-48 sm:h-64 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Carte interactive</p>
            </div>
          </motion.div>

          {/* Formulaire de contact */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white border border-border rounded-sm p-4 sm:p-6 md:p-8">
              <h2 className="text-2xl sm:text-3xl font-serif mb-4 sm:mb-6">Envoyez-nous un message</h2>
              
              <form data-testid="contact-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="nom" className="block text-xs sm:text-sm font-medium mb-2">Nom complet *</label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    data-testid="contact-form-name"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    data-testid="contact-form-email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="telephone" className="block text-xs sm:text-sm font-medium mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    data-testid="contact-form-phone"
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs sm:text-sm font-medium mb-2">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    data-testid="contact-form-message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm sm:text-base"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  data-testid="contact-form-submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary px-4 sm:px-6 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                </button>

                {submitStatus && (
                  <div
                    data-testid="contact-form-status"
                    className={`p-3 sm:p-4 rounded-sm text-xs sm:text-sm ${
                      submitStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}