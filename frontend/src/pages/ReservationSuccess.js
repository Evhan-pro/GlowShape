import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Calendar, Clock, User, CreditCard, Info } from 'lucide-react';

export default function ReservationSuccess() {
  const { state } = useLocation();
  const reservation = state?.reservation;

  if (!reservation) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom max-w-2xl px-4">
          <div className="bg-white border border-red-200 rounded-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-600 text-3xl">&#10005;</span>
            </div>
            <h1 className="text-2xl font-serif mb-4 text-red-600">Page expiree</h1>
            <p className="text-muted-foreground mb-8">Cette page n'est plus disponible. Si votre reservation a bien ete confirmee, vous recevrez un email de confirmation.</p>
            <Link
              to="/reservation"
              className="inline-block btn-primary px-8 py-3 bg-accent text-accent-foreground rounded-sm font-medium"
            >
              Nouvelle reservation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (t) => t ? t.substring(0, 5) : t;

  return (
    <div data-testid="payment-success-page" className="min-h-screen pt-24 pb-16">
      <div className="container-custom max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-border rounded-sm p-6 sm:p-8 md:p-12 text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-green-600" size={40} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif mb-4">Reservation confirmee !</h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            Votre carte a ete enregistree avec succes.
            Un email de confirmation a ete envoye a <strong>{reservation.email_client}</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6 text-left">
            <h3 className="font-medium mb-2 text-sm flex items-center space-x-2">
              <Info className="text-blue-600" size={18} />
              <span>Comment se deroule le paiement ?</span>
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>Aujourd'hui : Aucun debit, votre carte est juste enregistree</li>
              <li>Le jour de votre RDV a 8h00 : L'acompte de {reservation.montant_acompte}EUR (30%) sera automatiquement debite</li>
              <li>Au salon : Vous reglez les {(parseFloat(reservation.montant_total) - parseFloat(reservation.montant_acompte)).toFixed(2)}EUR restants (70%)</li>
            </ul>
          </div>

          <div className="bg-secondary/30 rounded-sm p-6 mb-8 text-left">
            <h2 className="font-medium mb-4 text-center text-lg">Details de votre reservation</h2>
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
                    {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Horaire</p>
                  <p className="font-medium">{formatTime(reservation.heure_debut)} - {formatTime(reservation.heure_fin)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Montants</p>
                  <div className="space-y-1">
                    <p className="font-medium">Total : {reservation.montant_total}EUR</p>
                    <p className="text-sm text-accent">Acompte (debite le jour J) : {reservation.montant_acompte}EUR</p>
                    <p className="text-sm">A payer au salon : {(parseFloat(reservation.montant_total) - parseFloat(reservation.montant_acompte)).toFixed(2)}EUR</p>
                  </div>
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

          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-8 text-left">
            <h3 className="font-medium mb-2 text-sm">Politique d'annulation</h3>
            <ul className="text-xs text-amber-900 space-y-1">
              <li>Annulation plus de 48h avant : <strong>gratuite</strong>, aucun debit</li>
              <li>Annulation moins de 48h avant : <strong>acompte de {reservation.montant_acompte}EUR debite</strong></li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn-primary px-8 py-3 bg-accent text-accent-foreground rounded-sm font-medium text-center"
            >
              Retour a l'accueil
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
