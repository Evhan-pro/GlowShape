import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Loader, AlertCircle } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: { color: '#9e2146' },
  },
};

export default function CardPaymentForm({
  reservationData,
  montantTotal,
  montantAcompte,
  onSuccess,
  onError
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // ÉTAPE 1 : Créer le Setup Intent (PAS de réservation)
      const setupResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stripe/create-setup-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservationData)
        }
      );

      if (!setupResponse.ok) {
        const errData = await setupResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la préparation du paiement');
      }

      const { clientSecret, setupIntentId, customerId } = await setupResponse.json();

      // ÉTAPE 2 : Confirmer la carte avec Stripe
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: reservationData.nom_client,
              email: reservationData.email_client,
              phone: reservationData.telephone_client,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // ÉTAPE 3 : Carte validée ! Maintenant créer la réservation
      const confirmResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stripe/confirm-and-book`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setup_intent_id: setupIntentId,
            payment_method_id: setupIntent.payment_method,
            customer_id: customerId,
            ...reservationData
          })
        }
      );

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Erreur lors de la confirmation');
      }

      // Stocker pour la page de succès
      onSuccess(confirmData.reservation);
      navigate('/reservation-success', { state: { reservation: confirmData.reservation } });

    } catch (error) {
      console.error('Erreur paiement:', error);
      setErrorMessage(error.message);
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="card-payment-form" className="space-y-6">
      {/* Info paiement différé */}
      <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-2">Comment fonctionne le paiement ?</p>
            <ul className="text-blue-800 space-y-1 text-xs">
              <li>Votre carte sera <strong>enregistrée de maniere securisee</strong></li>
              <li><strong>Aucun debit immediat</strong></li>
              <li>Le <strong>jour de votre RDV a 8h00</strong>, l'acompte de <strong>{montantAcompte.toFixed(2)}€ (30%)</strong> sera automatiquement debite</li>
              <li>Les <strong>{(montantTotal - montantAcompte).toFixed(2)}€ restants (70%)</strong> seront a regler au salon</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recapitulatif montants */}
      <div className="bg-secondary/30 rounded-sm p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant total :</span>
            <span className="font-medium">{montantTotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Acompte (debite le jour J) :</span>
            <span className="font-medium text-accent">{montantAcompte.toFixed(2)}€ (30%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">A payer au salon :</span>
            <span className="font-medium">{(montantTotal - montantAcompte).toFixed(2)}€ (70%)</span>
          </div>
        </div>
      </div>

      {/* Champ carte */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
          <CreditCard size={18} />
          <span>Informations de carte bancaire</span>
        </label>
        <div className="border border-input rounded-sm p-4 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Paiement securise par Stripe - Aucune donnee stockee sur nos serveurs
        </p>
      </div>

      {/* Politique d'annulation */}
      <div className="bg-amber-50 border border-amber-200 rounded-sm p-3">
        <p className="text-xs text-amber-900">
          <strong>Politique d'annulation :</strong> Annulation gratuite si effectuee plus de 48h avant le RDV.
          Annulation a moins de 48h : l'acompte de {montantAcompte.toFixed(2)}€ sera debite.
        </p>
      </div>

      {/* Erreur */}
      {errorMessage && (
        <div data-testid="payment-error" className="bg-red-50 border border-red-200 rounded-sm p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Bouton */}
      <button
        type="submit"
        data-testid="confirm-card-button"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary px-6 py-3 bg-accent text-accent-foreground rounded-sm font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Verification en cours...</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Confirmer et enregistrer la carte</span>
          </>
        )}
      </button>
    </form>
  );
}
