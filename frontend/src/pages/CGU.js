import React from 'react';
import { motion } from 'framer-motion';

export default function CGU() {
  return (
    <div data-testid="cgu-page" className="min-h-screen pt-24 pb-16">
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="container-custom text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4"
          >
            Conditions Générales d'Utilisation
          </motion.h1>
        </div>
      </section>

      <div className="container-custom max-w-4xl py-8 sm:py-12 px-4">
        <div className="prose prose-sm sm:prose-base max-w-none space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 1 – Objet</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site internet Glow & Shape. En accédant au site, l'utilisateur accepte sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 2 – Accès au site</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Le site est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 3 – Propriété intellectuelle</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              L'ensemble des éléments du site (textes, images, logos, vidéos, graphismes, etc.) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation, totale ou partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 4 – Données personnelles</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les données personnelles collectées via le site (formulaire de contact, réservation) sont traitées conformément au Règlement Général sur la Protection des Données (RGPD). L'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données en contactant l'institut.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 5 – Cookies</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Le site peut utiliser des cookies pour améliorer l'expérience de navigation. L'utilisateur peut configurer son navigateur pour refuser les cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 6 – Responsabilité</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              L'éditeur du site ne saurait être tenu responsable des erreurs, d'une absence de disponibilité des informations et/ou de la présence de virus sur le site.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 7 – Modification des CGU</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur le site.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-serif mb-3">Article 8 – Droit applicable</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
              Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
