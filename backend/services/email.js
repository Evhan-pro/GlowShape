require('dotenv').config();
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact.glowshape49@gmail.com';

async function sendReservationConfirmation(reservation) {
  if (!resend) {
    console.log('[EMAIL] Resend non configure - email non envoye (RESEND_API_KEY manquante)');
    return { sent: false, reason: 'resend_not_configured' };
  }

  const formatTime = (t) => t ? t.substring(0, 5) : t;
  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const clientHtml = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #c9a96e; margin: 0; font-size: 24px;">Glow & Shape</h1>
        <p style="color: #ffffff; margin: 10px 0 0; font-size: 14px;">Confirmation de reservation</p>
      </div>
      <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5;">
        <p style="font-size: 16px;">Bonjour <strong>${reservation.nom_client}</strong>,</p>
        <p>Votre reservation a bien ete confirmee. Voici les details :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 12px 0; color: #666; width: 40%;">Prestation</td>
            <td style="padding: 12px 0; font-weight: bold;">${reservation.prestation_nom}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 12px 0; color: #666;">Date</td>
            <td style="padding: 12px 0; font-weight: bold;">${formatDate(reservation.date)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 12px 0; color: #666;">Horaire</td>
            <td style="padding: 12px 0; font-weight: bold;">${formatTime(reservation.heure_debut)} - ${formatTime(reservation.heure_fin)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 12px 0; color: #666;">Montant total</td>
            <td style="padding: 12px 0; font-weight: bold;">${reservation.montant_total} EUR</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 12px 0; color: #666;">Acompte (jour J)</td>
            <td style="padding: 12px 0; font-weight: bold; color: #c9a96e;">${reservation.montant_acompte} EUR (30%)</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #666;">A payer au salon</td>
            <td style="padding: 12px 0; font-weight: bold;">${(parseFloat(reservation.montant_total) - parseFloat(reservation.montant_acompte)).toFixed(2)} EUR (70%)</td>
          </tr>
        </table>
        <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 15px; margin: 20px 0; font-size: 13px;">
          <strong>Paiement differe :</strong> Votre carte est enregistree. L'acompte de ${reservation.montant_acompte} EUR sera automatiquement debite le jour de votre RDV a 8h00.
        </div>
        <div style="background: #fff3e0; border: 1px solid #ffcc80; padding: 15px; font-size: 13px;">
          <strong>Politique d'annulation :</strong> Annulation gratuite si effectuee plus de 48h avant le RDV. En dessous de 48h, l'acompte de ${reservation.montant_acompte} EUR sera debite.
        </div>
        <p style="margin-top: 25px; font-size: 14px; color: #666;">A bientot chez Glow & Shape !</p>
      </div>
    </div>`;

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <h1 style="color: #c9a96e; margin: 0; font-size: 20px;">Nouvelle reservation</h1>
      </div>
      <div style="padding: 25px; background: #fafafa; border: 1px solid #e5e5e5;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 10px 0; color: #666; width: 35%;">Client</td>
            <td style="padding: 10px 0; font-weight: bold;">${reservation.nom_client}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 10px 0; color: #666;">Email</td>
            <td style="padding: 10px 0;">${reservation.email_client}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 10px 0; color: #666;">Telephone</td>
            <td style="padding: 10px 0;">${reservation.telephone_client}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 10px 0; color: #666;">Prestation</td>
            <td style="padding: 10px 0; font-weight: bold;">${reservation.prestation_nom}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 10px 0; color: #666;">Date</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatDate(reservation.date)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 10px 0; color: #666;">Horaire</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatTime(reservation.heure_debut)} - ${formatTime(reservation.heure_fin)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Montant</td>
            <td style="padding: 10px 0; font-weight: bold;">${reservation.montant_total} EUR (acompte: ${reservation.montant_acompte} EUR)</td>
          </tr>
        </table>
      </div>
    </div>`;

  const results = { client: false, admin: false };

  try {
    const clientResult = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [reservation.email_client],
      subject: `Confirmation de reservation - Glow & Shape`,
      html: clientHtml
    });
    results.client = true;
    console.log(`[EMAIL] Confirmation envoyee a ${reservation.email_client}:`, clientResult);
  } catch (err) {
    console.error(`[EMAIL] Erreur envoi client:`, err.message);
  }

  try {
    const adminResult = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `Nouvelle reservation: ${reservation.nom_client} - ${formatDate(reservation.date)}`,
      html: adminHtml
    });
    results.admin = true;
    console.log(`[EMAIL] Notification admin envoyee:`, adminResult);
  } catch (err) {
    console.error(`[EMAIL] Erreur envoi admin:`, err.message);
  }

  return { sent: true, results };
}

// Generic sendEmail function for routes.js
async function sendEmail(to, subject, html) {
  if (!resend) {
    console.log(`[EMAIL] Resend non configure - email non envoye a ${to} (RESEND_API_KEY manquante)`);
    console.log(`[EMAIL] Subject: ${subject}`);
    return { sent: false, reason: 'resend_not_configured' };
  }

  try {
    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: subject,
      html: html
    });
    console.log(`[EMAIL] Email envoye a ${to}:`, result);
    return { sent: true, result };
  } catch (err) {
    console.error(`[EMAIL] Erreur envoi a ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendReservationConfirmation, sendEmail };
