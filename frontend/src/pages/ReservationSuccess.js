import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Calendar, Clock, User, CreditCard, Loader } from 'lucide-react';

export default function ReservationSuccess() {
  const [searchParams] = useSearchParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Confirmer le paiement avec le backend
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stripe/confirm-payment/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setReservation(data.reservation);
          } else {
            setError('Le paiement n\'a pas pu être confirmé');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Erreur:', err);
          setError('Erreur de connexion au serveur');
          setLoading(false);
        });
    } else {
      setError('Session de paiement introuvable');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-accent" size={48} />
          <p className="text-muted-foreground">Confirmation du paiement en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom max-w-2xl px-4">
          <div className="bg-white border border-red-200 rounded-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-600 text-3xl">✕</span>
            </div>
            <h1 className="text-2xl font-serif mb-4 text-red-600">Erreur</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Link
              to="/reservation"
              className="inline-block btn-primary px-8 py-3 bg-accent text-accent-foreground rounded-sm font-medium"
            >
              Retour à la réservation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="payment-success-page" className="min-h-screen pt-24 pb-16">
      <div className="container-custom max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-border rounded-sm p-6 sm:p-8 md:p-12 text-center"
        >
          {/* Icône de succès */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-green-600" size={40} />
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-serif mb-4">Paiement Confirmé !</h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            Votre réservation a été confirmée et payée avec succès. 
            Un email de confirmation vous a été envoyé à <strong>{reservation?.email_client}</strong>
          </p>

          {/* Détails de la réservation */}
          {reservation && (
            <div className="bg-secondary/30 rounded-sm p-6 mb-8 text-left">
              <h2 className="font-medium mb-4 text-center text-lg">Détails de votre réservation</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Prestation</p>
                    <p className="font-medium">{reservation.prestation_nom}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(reservation.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Horaire</p>
                    <p className="font-medium">{reservation.heure_debut} - {reservation.heure_fin}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CreditCard size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Montant payé</p>
                    <p className="font-medium text-accent text-xl">{reservation.montant_total}€</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{reservation.nom_client}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Politique d'annulation */}
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-8 text-left">
            <h3 className="font-medium mb-2 text-sm">💡 Politique d'annulation</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Annulation plus de 48h avant : remboursement complet (100%)</li>
              <li>• Annulation moins de 48h avant : remboursement partiel (70%, acompte de 30% conservé)</li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn-primary px-8 py-3 bg-accent text-accent-foreground rounded-sm font-medium text-center"
            >
              Retour à l'accueil
            </Link>
            <Link
              to="/prestations"
              className="px-8 py-3 border border-border rounded-sm font-medium text-center hover:bg-secondary transition-colors"
            >
              Voir nos prestations
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
