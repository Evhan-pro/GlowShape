import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Save, Building, Clock, Share2 } from 'lucide-react';

const joursNoms = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const joursLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const defaultHoraires = {
  lundi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
  mardi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
  mercredi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
  jeudi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
  vendredi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
  samedi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
  dimanche: { ouvert: false, ouverture: '09:00', fermeture: '19:00' }
};

export default function AdminParametres() {
  const { getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    nom_institut: 'Glow & Shape',
    adresse: '',
    ville: '',
    telephone: '',
    email: '',
    facebook_url: '',
    instagram_url: '',
    horaires_defaut: defaultHoraires
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/site-settings`);
      const data = response.data;
      setFormData({
        nom_institut: data.nom_institut || 'Glow & Shape',
        adresse: data.adresse || '',
        ville: data.ville || '',
        telephone: data.telephone || '',
        email: data.email || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        horaires_defaut: data.horaires_defaut || defaultHoraires
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/site-settings`,
        formData,
        { headers: getAuthHeaders() }
      );
      setMessage('Paramètres enregistrés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateHoraire = (jour, field, value) => {
    setFormData(prev => ({
      ...prev,
      horaires_defaut: {
        ...prev.horaires_defaut,
        [jour]: {
          ...prev.horaires_defaut[jour],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Paramètres du Site</h1>
          <button
            onClick={handleSubmit}
            disabled={saving}
            data-testid="save-settings-btn"
            className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-50"
          >
            <Save size={20} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-sm ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations générales */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Building className="text-accent" size={24} />
              <h2 className="text-xl font-serif">Informations de l'Institut</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de l'institut</label>
                <input
                  type="text"
                  value={formData.nom_institut}
                  onChange={(e) => setFormData({ ...formData, nom_institut: e.target.value })}
                  data-testid="nom-institut-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Glow & Shape"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  data-testid="telephone-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="email-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="contact@glowandshape.fr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  data-testid="adresse-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="123 Avenue de la Beauté"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Ville (Code postal + Ville)</label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  data-testid="ville-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="75001 Paris"
                />
              </div>
            </div>
          </div>

          {/* Horaires par défaut */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="text-accent" size={24} />
              <div>
                <h2 className="text-xl font-serif">Horaires par défaut</h2>
                <p className="text-sm text-muted-foreground">Ces horaires s'affichent dans le footer et servent de base pour les disponibilités</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {joursNoms.map((jour, index) => {
                const horaire = formData.horaires_defaut[jour] || { ouvert: true, ouverture: '09:00', fermeture: '19:00' };
                return (
                  <div
                    key={jour}
                    className={`border rounded-sm p-4 ${horaire.ouvert ? 'border-border' : 'border-red-200 bg-red-50/30'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{joursLabels[index]}</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horaire.ouvert}
                          onChange={(e) => updateHoraire(jour, 'ouvert', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Ouvert</span>
                      </label>
                    </div>
                    
                    {horaire.ouvert ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Ouverture</label>
                          <input
                            type="time"
                            value={horaire.ouverture}
                            onChange={(e) => updateHoraire(jour, 'ouverture', e.target.value)}
                            className="w-full px-2 py-1 border border-input rounded-sm text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Fermeture</label>
                          <input
                            type="time"
                            value={horaire.fermeture}
                            onChange={(e) => updateHoraire(jour, 'fermeture', e.target.value)}
                            className="w-full px-2 py-1 border border-input rounded-sm text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Fermé
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Share2 className="text-accent" size={24} />
              <h2 className="text-xl font-serif">Réseaux Sociaux</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Facebook</label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  data-testid="facebook-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://facebook.com/glowandshape"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Instagram</label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  data-testid="instagram-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://instagram.com/glowandshape"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
