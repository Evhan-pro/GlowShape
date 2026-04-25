import React from 'react';
import { motion } from 'framer-motion';

export default function CGV() {
  return (
    <div data-testid="cgv-page" className="min-h-screen pt-24 pb-16">
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="container-custom text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4"
          >
            Conditions Générales de Vente
          </motion.h1>
        </div>
      </section>

      <div className="container-custom max-w-4xl py-8 sm:py-12 px-4">
        <div className="prose prose-sm sm:prose-base max-w-none space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 1 – Objet</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations des parties dans le cadre de la réservation et de la vente de prestations de beauté et bien-être proposées par l'institut Glow & Shape.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 2 – Prestations</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les prestations proposées sont celles décrites sur le site internet. L'institut se réserve le droit de modifier à tout moment la liste des prestations et les tarifs sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 3 – Tarifs</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les prix des prestations sont indiqués en euros TTC. L'institut se réserve le droit de modifier ses tarifs à tout moment. Les prestations seront facturées au tarif en vigueur au moment de la réservation.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 4 – Réservation</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              La réservation en ligne est confirmée par l'envoi d'un email de confirmation. Un acompte peut être demandé lors de la réservation. La réservation est considérée comme ferme et définitive après confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 5 – Annulation et report</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Toute annulation doit être effectuée au moins 24 heures avant le rendez-vous. En cas d'annulation tardive ou de non-présentation, l'acompte versé pourra être conservé par l'institut. L'institut se réserve le droit d'annuler ou reporter un rendez-vous en cas de force majeure.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 6 – Paiement</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Le paiement des prestations peut être effectué par carte bancaire via notre plateforme sécurisée. Le paiement de l'acompte est débité après la réalisation de la prestation.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 7 – Responsabilité</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              L'institut s'engage à fournir des prestations de qualité. En cas de réaction allergique ou de problème de santé, le client doit en informer l'institut avant la prestation. L'institut décline toute responsabilité en cas de non-respect de cette obligation par le client.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 8 – Droit de rétractation</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux prestations de services d'hébergement, de transport, de restauration et d'activités de loisirs fournies à une date déterminée.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 9 – Litiges</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents seront saisis.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 10 – Médiation</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, le consommateur peut recourir gratuitement au service de médiation proposé par l'institut. Le médiateur tentera, en toute indépendance et impartialité, de rapprocher les parties en vue d'aboutir à une solution amiable.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
