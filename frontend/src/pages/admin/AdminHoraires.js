import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Calendar as CalendarIcon, Save, Clock, X, Plus, Link as LinkIcon, AlertTriangle } from 'lucide-react';

export default function AdminHoraires() {
  const { getAuthHeaders } = useAuth();
  const [currentWeek, setCurrentWeek] = useState([]);
  const [weekStart, setWeekStart] = useState(new Date());
  const [horaires, setHoraires] = useState({});
  const [originalHoraires, setOriginalHoraires] = useState({});
  const [googleConnected, setGoogleConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const pendingWeekChange = useRef(null);

  useEffect(() => {
    checkGoogleStatus();
  }, []);

  useEffect(() => {
    generateCurrentWeek();
  }, [weekStart]);

  // Detect changes
  useEffect(() => {
    const changed = JSON.stringify(horaires) !== JSON.stringify(originalHoraires);
    setHasChanges(changed);
  }, [horaires, originalHoraires]);

  const checkGoogleStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/google/status`,
        { headers: getAuthHeaders() }
      );
      setGoogleConnected(response.data.connected);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const connectGoogle = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/google/login`,
        { headers: getAuthHeaders() }
      );
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la connexion Google');
    }
  };

  const generateCurrentWeek = () => {
    const week = [];
    const start = new Date(weekStart);
    start.setDate(start.getDate() - start.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date);
    }
    setCurrentWeek(week);
    fetchHoraires(week[0], week[6]);
  };

  const fetchHoraires = async (debut, fin) => {
    try {
      const dateDebut = debut.toISOString().split('T')[0];
      const dateFin = fin.toISOString().split('T')[0];
      
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/horaires?date_debut=${dateDebut}&date_fin=${dateFin}`,
        { headers: getAuthHeaders() }
      );
      
      const horairesMap = {};
      response.data.forEach(h => {
        horairesMap[h.date] = h;
      });
      setHoraires(horairesMap);
      setOriginalHoraires(horairesMap);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const saveHoraires = async () => {
    setSaving(true);
    try {
      const horairesList = Object.values(horaires);
      if (horairesList.length === 0) {
        alert('Aucune modification à enregistrer');
        setSaving(false);
        return true;
      }
      
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/horaires/batch`,
        horairesList,
        { headers: getAuthHeaders() }
      );
      
      // Update original to match current
      setOriginalHoraires({ ...horaires });
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const success = await saveHoraires();
    if (success) {
      alert('Horaires enregistrés !');
    }
  };

  const updateHoraire = (date, field, value) => {
    const dateStr = date.toISOString().split('T')[0];
    setHoraires(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || { date: dateStr, ouvert: true, heure_ouverture: '09:00', heure_fermeture: '19:00' }),
        [field]: value
      }
    }));
  };

  const getHoraire = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return horaires[dateStr] || {
      date: dateStr,
      ouvert: true,
      heure_ouverture: '09:00',
      heure_fermeture: '19:00'
    };
  };

  const changeWeek = async (direction) => {
    if (hasChanges) {
      pendingWeekChange.current = direction;
      setShowUnsavedWarning(true);
    } else {
      executeWeekChange(direction);
    }
  };

  const executeWeekChange = (direction) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setWeekStart(newStart);
  };

  const handleWarningChoice = async (choice) => {
    setShowUnsavedWarning(false);
    const direction = pendingWeekChange.current;
    
    if (choice === 'save') {
      const success = await saveHoraires();
      if (success) {
        executeWeekChange(direction);
      }
    } else if (choice === 'discard') {
      setHoraires({ ...originalHoraires });
      setHasChanges(false);
      executeWeekChange(direction);
    }
    // 'cancel' - do nothing
    pendingWeekChange.current = null;
  };

  const joursNoms = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-serif">Gestion des Horaires</h1>
            {hasChanges && (
              <span className="flex items-center text-amber-600 text-sm">
                <AlertTriangle size={16} className="mr-1" />
                Modifications non enregistrées
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            data-testid="save-horaires-btn"
            className={`flex items-center space-x-2 px-4 py-2 rounded-sm ${
              hasChanges 
                ? 'bg-accent text-accent-foreground hover:opacity-90' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            <Save size={20} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>

        <div className="bg-white border border-border rounded-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalendarIcon size={24} className="text-accent" />
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  {googleConnected
                    ? 'Synchronisation active - Les événements Google bloquent automatiquement les créneaux'
                    : 'Non connecté - Connectez votre agenda pour synchroniser les réservations'}
                </p>
              </div>
            </div>
            {!googleConnected && (
              <button
                onClick={connectGoogle}
                className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90"
              >
                <LinkIcon size={18} />
                <span>Connecter</span>
              </button>
            )}
            {googleConnected && (
              <span className="text-green-600 font-medium">✓ Connecté</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeWeek('prev')}
            data-testid="prev-week-btn"
            className="px-4 py-2 border border-border rounded-sm hover:bg-secondary"
          >
            ← Semaine précédente
          </button>
          <h2 className="text-xl font-medium">
            Semaine du {currentWeek[0]?.toLocaleDateString('fr-FR')} au{' '}
            {currentWeek[6]?.toLocaleDateString('fr-FR')}
          </h2>
          <button
            onClick={() => changeWeek('next')}
            data-testid="next-week-btn"
            className="px-4 py-2 border border-border rounded-sm hover:bg-secondary"
          >
            Semaine suivante →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentWeek.map((date, index) => {
            const horaire = getHoraire(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = date.toISOString().split('T')[0];
            const hasLocalChange = horaires[dateStr] && JSON.stringify(horaires[dateStr]) !== JSON.stringify(originalHoraires[dateStr]);
            
            return (
              <div
                key={index}
                data-testid={`day-card-${index}`}
                className={`bg-white border rounded-sm p-4 ${
                  isToday ? 'border-accent border-2' : hasLocalChange ? 'border-amber-400' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{joursNoms[index]}</h3>
                    <p className="text-sm text-muted-foreground">
                      {date.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={horaire.ouvert}
                      onChange={(e) => updateHoraire(date, 'ouvert', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Ouvert</span>
                  </label>
                </div>

                {horaire.ouvert ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Ouverture</label>
                      <input
                        type="time"
                        value={horaire.heure_ouverture}
                        onChange={(e) => updateHoraire(date, 'heure_ouverture', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Fermeture</label>
                      <input
                        type="time"
                        value={horaire.heure_fermeture}
                        onChange={(e) => updateHoraire(date, 'heure_fermeture', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Fermé
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-sm p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Astuce :</strong> Les horaires définis ici s'appliquent spécifiquement aux dates sélectionnées.
            N'oubliez pas d'enregistrer vos modifications avant de changer de semaine.
            Les événements ajoutés manuellement dans Google Calendar bloqueront automatiquement les créneaux correspondants sur le site.
          </p>
        </div>

        {/* Unsaved Changes Warning Modal */}
        {showUnsavedWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="text-amber-500" size={24} />
                <h3 className="text-lg font-medium">Modifications non enregistrées</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Vous avez des modifications non enregistrées pour cette semaine. Que souhaitez-vous faire ?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleWarningChoice('save')}
                  className="flex-1 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90"
                >
                  Enregistrer et continuer
                </button>
                <button
                  onClick={() => handleWarningChoice('discard')}
                  className="flex-1 border border-border px-4 py-2 rounded-sm hover:bg-secondary"
                >
                  Abandonner les modifications
                </button>
                <button
                  onClick={() => handleWarningChoice('cancel')}
                  className="flex-1 border border-border px-4 py-2 rounded-sm hover:bg-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
