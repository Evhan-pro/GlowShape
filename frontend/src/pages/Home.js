import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Award, Heart, ChevronRight, Star, ArrowRight } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true }
};

export default function Home() {
  const [prestationsPhares, setPrestationsPhares] = useState([]);
  const [temoignages, setTemoignages] = useState([]);
  const [avantApres, setAvantApres] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      const [prestationsRes, temoignagesRes, avantApresRes, contentRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/prestations`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/temoignages`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/avant-apres`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/homepage-content`)
      ]);

      const prestations = await safeJson(prestationsRes, 'prestations');
      if (Array.isArray(prestations)) setPrestationsPhares(prestations.slice(0, 3));

      const temoignagesData = await safeJson(temoignagesRes, 'temoignages');
      if (Array.isArray(temoignagesData)) setTemoignages(temoignagesData.slice(0, 3));

      const avantApresData = await safeJson(avantApresRes, 'avant-apres');
      if (Array.isArray(avantApresData)) setAvantApres(avantApresData.slice(0, 3));

      const contentData = await safeJson(contentRes, 'homepage-content');
      if (contentData && contentData.hero_titre) {
        setContent(contentData);
      }

    } catch (error) {
      console.error('Erreur fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const safeJson = async (response, label) => {
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(`[${label}] HTTP ${response.status}`, text?.slice?.(0, 200));
      return null;
    }
    return response.json();
  };


  const faqItems = [
    {
      question: 'Comment prendre rendez-vous ?',
      answer: 'Vous pouvez réserver en ligne via notre page de réservation ou nous appeler au 01 23 45 67 89.'
    },
    {
      question: 'Quels sont vos horaires ?',
      answer: 'Nous sommes ouverts du lundi au samedi de 9h00 à 19h00. Fermé le dimanche.'
    },
    {
      question: 'Puis-je annuler ma réservation ?',
      answer: 'Oui, merci de nous prévenir au moins 24h à l\'avance pour toute annulation.'
    },
    {
      question: 'Proposez-vous des cartes cadeaux ?',
      answer: 'Oui, nous proposons des cartes cadeaux pour toutes nos prestations. Contactez-nous pour plus d\'informations.'
    }
  ];

  // Fallback testimonials if none in DB
  const displayTemoignages = temoignages.length > 0 ? temoignages : [
    { id: 1, nom: 'Marie L.', texte: 'Un institut exceptionnel ! Le soin anti-âge a transformé ma peau. Je recommande vivement.', note: 5 },
    { id: 2, nom: 'Sophie D.', texte: 'Accueil chaleureux et prestations de grande qualité. Je suis cliente depuis 2 ans.', note: 5 },
    { id: 3, nom: 'Émilie R.', texte: 'Le massage aux pierres chaudes est divin. Un moment de pur bien-être.', note: 5 }
  ];

  if (loading || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div data-testid="home-page" className="overflow-x-hidden">
      {/* Hero Section */}
      <section data-testid="hero-section" className="relative min-h-screen h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={content.hero_image}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background"></div>
        </div>
        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-4 sm:mb-6"
          >
            {content.hero_titre}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 text-gray-200 px-4 whitespace-pre-line"
          >
            {content.hero_sous_titre}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              to="/reservation"
              data-testid="hero-cta-button"
              className="inline-flex items-center btn-primary px-6 sm:px-8 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium space-x-2 hover:shadow-hover text-sm sm:text-base"
            >
              <span>Réserver maintenant</span>
              <ChevronRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Prestations Phares */}
      <section data-testid="featured-services-section" className="py-12 sm:py-16 md:py-24">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif mb-3 sm:mb-4">Nos Prestations Phares</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Découvrez une sélection de nos soins les plus prisés
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
            {prestationsPhares.map((prestation, index) => (
              <motion.div
                key={prestation.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                data-testid={`featured-service-card-${index}`}
                className="group bg-white border border-border rounded-sm overflow-hidden hover-lift"
              >
                <div className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <Sparkles className="text-accent" size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif mb-2">{prestation.nom}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 whitespace-pre-line">{prestation.description}</p>
                  <div className="flex items-center justify-between mb-3 sm:mb-0">
                    <span className="text-xl sm:text-2xl font-serif text-accent">{prestation.prix_euros}€</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{prestation.duree_minutes} min</span>
                  </div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <Link
                    to="/reservation"
                    data-testid={`service-book-button-${index}`}
                    className="block text-center btn-primary px-4 py-2 bg-accent text-accent-foreground rounded-sm text-sm font-medium"
                  >
                    Réserver
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeInUp} className="text-center mt-8 sm:mt-12">
            <Link
              to="/prestations"
              data-testid="view-all-services-link"
              className="inline-flex items-center text-accent hover:underline font-medium space-x-2 text-sm sm:text-base"
            >
              <span>Voir toutes nos prestations</span>
              <ChevronRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Avant/Après Section */}
      {avantApres.length > 0 && (
        <section data-testid="avant-apres-preview-section" className="py-12 sm:py-16 md:py-24 bg-secondary/30">
          <div className="container-custom">
            <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif mb-3 sm:mb-4">Nos Transformations</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Découvrez les résultats de nos soins experts
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
              {avantApres.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  data-testid={`avant-apres-preview-${index}`}
                  className="bg-white border border-border rounded-sm overflow-hidden hover-lift"
                >
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <img
                        src={item.image_avant}
                        alt={`${item.titre} - Avant`}
                        className="w-full h-32 sm:h-40 object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Avant
                      </span>
                    </div>
                    <div className="relative">
                      <img
                        src={item.image_apres}
                        alt={`${item.titre} - Après`}
                        className="w-full h-32 sm:h-40 object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
                        Après
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-serif text-base sm:text-lg">{item.titre}</h3>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div {...fadeInUp} className="text-center mt-8 sm:mt-12">
              <Link
                to="/avant-apres"
                data-testid="view-all-transformations-link"
                className="inline-flex items-center text-accent hover:underline font-medium space-x-2 text-sm sm:text-base"
              >
                <span>Voir toutes nos transformations</span>
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* À Propos */}
      <section data-testid="about-section" className={`py-12 sm:py-16 md:py-24 ${avantApres.length === 0 ? 'bg-secondary/30' : ''}`}>
        <div className="container-custom px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div {...fadeInUp}>
              <img
                src={content.about_image}
                alt="Institut intérieur"
                className="rounded-sm shadow-soft w-full"
              />
            </motion.div>
            <motion.div {...fadeInUp} className="px-4 sm:px-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-4 sm:mb-6">{content.about_titre}</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 whitespace-pre-line">
                {content.about_texte}
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="text-accent" size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1 text-sm sm:text-base">Expertise Reconnue</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Des professionnelles certifiées et passionnées</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="text-accent" size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1 text-sm sm:text-base">Sur Mesure</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Chaque soin adapté à vos besoins spécifiques</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section data-testid="testimonials-section" className="py-12 sm:py-16 md:py-24 bg-secondary/30">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif mb-3 sm:mb-4">Ce Que Disent Nos Clientes</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Votre satisfaction est notre fierté</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
            {displayTemoignages.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                data-testid={`testimonial-card-${index}`}
                className="bg-white border border-border rounded-sm p-4 sm:p-6"
              >
                <div className="flex mb-3 sm:mb-4">
                  {[...Array(testimonial.note || 5)].map((_, i) => (
                    <Star key={i} size={16} className="text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-3 sm:mb-4 italic text-sm">"{testimonial.texte}"</p>
                <p className="font-medium text-sm">{testimonial.nom}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-testid="faq-section" className="py-12 sm:py-16 md:py-24">
        <div className="container-custom max-w-4xl px-4">
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif mb-3 sm:mb-4">Questions Fréquentes</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Tout ce que vous devez savoir</p>
          </motion.div>

          <div className="space-y-3 sm:space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                data-testid={`faq-item-${index}`}
                className="bg-white border border-border rounded-sm p-4 sm:p-6"
              >
                <h3 className="font-medium text-base sm:text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section data-testid="final-cta-section" className="py-12 sm:py-16 md:py-24 bg-secondary/30">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif mb-4 sm:mb-6">{content.cta_titre}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 whitespace-pre-line">
              {content.cta_texte}
            </p>
            <Link
              to="/reservation"
              data-testid="final-cta-button"
              className="inline-flex items-center btn-primary px-6 sm:px-8 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium space-x-2 hover:shadow-hover text-sm sm:text-base"
            >
              <span>Réserver en ligne</span>
              <ChevronRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
