require('dotenv').config();
const { google } = require('googleapis');
const { GoogleToken, Reservation } = require('../models');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getGoogleCredentials() {
  const tokenDoc = await GoogleToken.findOne();
  if (!tokenDoc) return null;

  oauth2Client.setCredentials({
    access_token: tokenDoc.access_token,
    refresh_token: tokenDoc.refresh_token,
    token_type: tokenDoc.token_type,
    expiry_date: tokenDoc.expiry_date
  });

  return oauth2Client;
}

async function createCalendarEvent(reservation) {
  try {
    const auth = await getGoogleCredentials();
    if (!auth) {
      console.log('Google Calendar not connected');
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const startDateTime = new Date(`${reservation.date}T${reservation.heure_debut}`);
    const endDateTime = new Date(`${reservation.date}T${reservation.heure_fin}`);

    const event = {
      summary: `[Site] ${reservation.prestation_nom} - ${reservation.nom_client}`,
      description: `Réservation du site\n\nClient: ${reservation.nom_client}\nEmail: ${reservation.email_client}\nTéléphone: ${reservation.telephone_client}\nPrestation: ${reservation.prestation_nom}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Paris' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Paris' },
      extendedProperties: { private: { reservation_id: reservation.id, source: 'website' } }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    await Reservation.update(
      { google_event_id: response.data.id },
      { where: { id: reservation.id } }
    );

    console.log('✓ Google Calendar event created:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Calendar event creation error:', error.message);
    return null;
  }
}

async function getCalendarEvents(dateDebut, dateFin) {
  try {
    const auth = await getGoogleCredentials();
    if (!auth) return [];

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: dateDebut.toISOString(),
      timeMax: dateFin.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Calendar fetch error:', error.message);
    return [];
  }
}

module.exports = {
  oauth2Client,
  createCalendarEvent,
  getCalendarEvents
};
