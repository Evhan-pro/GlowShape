import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, User, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 }
};

export default function Reservation() {
  const location = useLocation();
  const prestationIdFromState = location.state?.prestationId;

  const [step, setStep] = useState(1);
  const [prestations, setPrestations] = useState([]);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [creneaux, setCreneaux] = useState([]);
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    nom: '',
    email: '',
    telephone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationConfirmed, setReservationConfirmed] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);

  // Générer les dates disponibles (AVEC RESTRICTION 48H)
  const generateAvailableDates = () => {
    const dates = [];
    const now = new Date();
    
    // Ajouter 48 heures (2 jours) au minimum
    const minDate = new Date(now);
    minDate.setHours(now.getHours() + 48);
    
    // Générer 14 dates à partir de minDate
    for (let i = 0; i < 14; i++) {
      const date = new Date(minDate);
      date.setDate(minDate.getDate() + i);
      // Exclure les dimanches (jour 0)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  useEffect(() => {
    fetchPrestations();
  }, []);

  useEffect(() => {
    if (prestationIdFromState && prestations.length > 0) {
      const prestation = prestations.find(p => p.id === prestationIdFromState);
      if (prestation) {
        setSelectedPrestation(prestation);
        setStep(2);
      }
    }
  }, [prestationIdFromState, prestations]);

  useEffect(() => {
    if (selectedDate && selectedPrestation) {
      fetchCreneaux();
    }
  }, [selectedDate, selectedPrestation]);

  const fetchPrestations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/prestations`);
      const data = await response.json();
      setPrestations(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCreneaux = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/disponibilites?date=${dateStr}&prestation_id=${selectedPrestation.id}`
      );
      const data = await response.json();
      setCreneaux(data.creneaux);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmitReservation = async () => {
    setIsSubmitting(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const reservationData = {
        prestation_id: selectedPrestation.id,
        nom_client: clientInfo.nom,
        email_client: clientInfo.email,
        telephone_client: clientInfo.telephone,
        date: dateStr,
        heure_debut: selectedCreneau.heure_debut,
        heure_fin: selectedCreneau.heure_fin
      };

      // Créer la session de paiement Stripe
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        const { url } = await response.json();
        // Rediriger vers Stripe Checkout
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(error.error || 'Une erreur est survenue lors de la création du paiement');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (reservationConfirmed && reservationDetails) {
    return (
      <div data-testid="confirmation-page" className="min-h-screen pt-24 pb-16">
        <div className="container-custom max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-sm p-6 sm:p-8 md:p-12 text-center"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Check className="text-green-600" size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif mb-3 sm:mb-4">Réservation Confirmée !</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Votre réservation a été enregistrée avec succès. Un email de confirmation vous a été envoyé.
            </p>

            <div className="bg-secondary/30 rounded-sm p-4 sm:p-6 mb-6 sm:mb-8 text-left">
              <h2 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Détails de votre réservation :</h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Prestation :</span>
                  <span className="ml-2 font-medium break-words">{reservationDetails.prestation_nom}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date :</span>
                  <span className="ml-2 font-medium">{reservationDetails.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Horaire :</span>
                  <span className="ml-2 font-medium">{reservationDetails.heure_debut} - {reservationDetails.heure_fin}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nom :</span>
                  <span className="ml-2 font-medium break-words">{reservationDetails.nom_client}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary px-6 sm:px-8 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium text-sm sm:text-base"
            >
              Retour à l'accueil
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="reservation-page" className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="container-custom text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-4"
          >
            Réservation en ligne
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto"
          >
            Réservez votre soin en quelques clics
          </motion.p>
        </div>
      </section>

      <div className="container-custom py-8 sm:py-12 max-w-4xl px-4">
        {/* Progress Steps */}
        <div data-testid="booking-steps" className="flex items-center justify-center mb-8 sm:mb-12 overflow-x-auto pb-2">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className="flex items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm sm:text-base ${
                    step >= num
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {num}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    {num === 1 && 'Prestation'}
                    {num === 2 && 'Date & Heure'}
                    {num === 3 && 'Vos infos'}
                  </p>
                </div>
              </div>
              {num < 3 && <div className="w-8 sm:w-12 md:w-24 h-0.5 bg-border mx-2 sm:mx-4 flex-shrink-0"></div>}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Sélection prestation */}
          {step === 1 && (
            <motion.div key="step1" {...fadeInUp} data-testid="step-1">
              <div className="bg-white border border-border rounded-sm p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">Choisissez votre prestation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {prestations.map((prestation) => (
                    <button
                      key={prestation.id}
                      data-testid={`prestation-option-${prestation.id}`}
                      onClick={() => {
                        setSelectedPrestation(prestation);
                        setStep(2);
                      }}
                      className="text-left p-3 sm:p-4 border border-border rounded-sm hover:border-accent hover:bg-accent/5 transition-colors"
                    >
                      <h3 className="font-medium mb-2 text-sm sm:text-base">{prestation.nom}</h3>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                        <span>{prestation.duree_minutes} min</span>
                        <span className="text-accent font-medium">{prestation.prix_euros}€</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Sélection date et créneau */}
          {step === 2 && selectedPrestation && (
            <motion.div key="step2" {...fadeInUp} data-testid="step-2">
              <div className="bg-white border border-border rounded-sm p-4 sm:p-6 md:p-8">
                <div className="mb-4 sm:mb-6">
                  <button
                    data-testid="back-to-step-1"
                    onClick={() => setStep(1)}
                    className="flex items-center text-accent hover:underline text-xs sm:text-sm mb-4"
                  >
                    <ChevronLeft size={16} />
                    <span>Changer de prestation</span>
                  </button>
                  <div className="bg-secondary/30 p-3 sm:p-4 rounded-sm">
                    <p className="text-xs sm:text-sm text-muted-foreground">Prestation sélectionnée</p>
                    <p className="font-medium text-sm sm:text-base">{selectedPrestation.nom}</p>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">Choisissez une date</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                  {availableDates.map((date, index) => (
                    <button
                      key={index}
                      data-testid={`date-option-${index}`}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 sm:p-3 md:p-4 border rounded-sm text-xs sm:text-sm transition-colors ${
                        selectedDate && selectedDate.toDateString && selectedDate.toDateString() === date.toDateString()
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      <p className="font-medium">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                      <p className="text-xs text-muted-foreground mt-1">{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </button>
                  ))}
                </div>

                {selectedDate && (
                  <div data-testid="creneaux-container">
                    <h3 className="text-lg sm:text-xl font-serif mb-3 sm:mb-4">Créneaux disponibles</h3>
                    {creneaux.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                        {creneaux.map((creneau, index) => (
                          <button
                            key={index}
                            data-testid={`creneau-${index}`}
                            onClick={() => creneau.disponible && setSelectedCreneau(creneau)}
                            disabled={!creneau.disponible}
                            className={`p-2 sm:p-3 border rounded-sm text-xs sm:text-sm transition-colors ${
                              !creneau.disponible
                                ? 'opacity-30 cursor-not-allowed'
                                : selectedCreneau?.heure_debut === creneau.heure_debut
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border hover:border-accent'
                            }`}
                          >
                            {creneau.heure_debut}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs sm:text-sm">Chargement des créneaux...</p>
                    )}

                    {selectedCreneau && (
                      <button
                        data-testid="next-to-step-3"
                        onClick={() => setStep(3)}
                        className="w-full btn-primary px-4 sm:px-6 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium text-sm sm:text-base"
                      >
                        Continuer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Informations client */}
          {step === 3 && selectedCreneau && (
            <motion.div key="step3" {...fadeInUp} data-testid="step-3">
              <div className="bg-white border border-border rounded-sm p-4 sm:p-6 md:p-8">
                <button
                  data-testid="back-to-step-2"
                  onClick={() => setStep(2)}
                  className="flex items-center text-accent hover:underline text-xs sm:text-sm mb-4 sm:mb-6"
                >
                  <ChevronLeft size={16} />
                  <span>Retour</span>
                </button>

                <div className="bg-secondary/30 p-3 sm:p-4 rounded-sm mb-4 sm:mb-6">
                  <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Récapitulatif</h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-accent flex-shrink-0" />
                      <span className="break-words">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-accent flex-shrink-0" />
                      <span>{selectedCreneau.heure_debut} - {selectedCreneau.heure_fin}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-accent flex-shrink-0" />
                      <span className="break-words">{selectedPrestation.nom}</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">Vos informations</h2>
                
                {/* Afficher le montant à payer */}
                <div className="bg-accent/10 border border-accent/30 rounded-sm p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="text-accent" size={20} />
                      <span className="font-medium">Montant à payer</span>
                    </div>
                    <span className="text-2xl font-serif text-accent">{selectedPrestation.prix_euros}€</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Paiement sécurisé par Stripe • Politique d'annulation : remboursement complet si annulation plus de 48h avant le RDV
                  </p>
                </div>

                <form
                  data-testid="client-info-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitReservation();
                  }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Nom complet *</label>
                    <input
                      type="text"
                      data-testid="client-name-input"
                      required
                      value={clientInfo.nom}
                      onChange={(e) => setClientInfo({ ...clientInfo, nom: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      data-testid="client-email-input"
                      required
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      data-testid="client-phone-input"
                      required
                      value={clientInfo.telephone}
                      onChange={(e) => setClientInfo({ ...clientInfo, telephone: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    data-testid="confirm-reservation-button"
                    disabled={isSubmitting}
                    className="w-full btn-primary px-4 sm:px-6 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium disabled:opacity-50 text-sm sm:text-base flex items-center justify-center space-x-2"
                  >
                    <CreditCard size={20} />
                    <span>{isSubmitting ? 'Redirection vers le paiement...' : 'Procéder au paiement'}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}