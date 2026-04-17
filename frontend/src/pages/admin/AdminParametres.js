import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Save, Building, MapPin, Phone, Mail, Globe, Clock, Loader } from 'lucide-react';

export default function AdminParametres() {
  const [settings, setSettings] = useState({
    nom_institut: '', adresse: '', ville: '', telephone: '', email: '',
    facebook_url: '', instagram_url: '', horaires_defaut: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const defaultHoraires = {
    lundi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
    mardi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
    mercredi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
    jeudi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
    vendredi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
    samedi: { ouvert: true, ouverture: '09:00', fermeture: '19:00' },
    dimanche: { ouvert: false, ouverture: '09:00', fermeture: '19:00' }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/site-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSettings({
        ...data,
        horaires_defaut: data.horaires_defaut || defaultHoraires
      });
    } catch (err) {
      setError('Erreur chargement parametres');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      setSuccess('Parametres sauvegardes !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const updateHoraire = (jour, field, value) => {
    setSettings(prev => ({
      ...prev,
      horaires_defaut: {
        ...(prev.horaires_defaut || defaultHoraires),
        [jour]: { ...(prev.horaires_defaut || defaultHoraires)[jour], [field]: value }
      }
    }));
  };

  const jours = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ];

  if (loading) return <AdminLayout><div className="flex justify-center p-12"><Loader className="animate-spin" size={32} /></div></AdminLayout>;

  const horaires = settings.horaires_defaut || defaultHoraires;

  return (
    <AdminLayout>
      <div data-testid="admin-parametres" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-serif">Parametres du site</h1>
          <button
            data-testid="save-settings-btn" onClick={handleSave} disabled={saving}
            className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>

        {success && <div className="bg-green-50 border border-green-200 rounded-sm p-3 text-green-800 text-sm">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-red-800 text-sm">{error}</div>}

        {/* Informations generales */}
        <div className="bg-white border border-border rounded-sm p-5 sm:p-6">
          <h2 className="flex items-center space-x-2 text-lg font-medium mb-4">
            <Building size={20} className="text-accent" />
            <span>Informations generales</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de l'institut</label>
              <input data-testid="setting-nom" type="text" value={settings.nom_institut || ''} onChange={e => setSettings({...settings, nom_institut: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-sm text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telephone</label>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-muted-foreground" />
                <input data-testid="setting-telephone" type="text" value={settings.telephone || ''} onChange={e => setSettings({...settings, telephone: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-sm text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-muted-foreground" />
                <input data-testid="setting-email" type="email" value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-sm text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white border border-border rounded-sm p-5 sm:p-6">
          <h2 className="flex items-center space-x-2 text-lg font-medium mb-4">
            <MapPin size={20} className="text-accent" />
            <span>Adresse (affichee sur le site + carte contact)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input data-testid="setting-adresse" type="text" value={settings.adresse || ''} onChange={e => setSettings({...settings, adresse: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-sm text-sm" placeholder="Espace Anjou" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ville / Code postal</label>
              <input data-testid="setting-ville" type="text" value={settings.ville || ''} onChange={e => setSettings({...settings, ville: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-sm text-sm" placeholder="49000 Angers" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            L'adresse est utilisee pour la carte interactive sur la page Contact.
          </p>
        </div>

        {/* Reseaux sociaux */}
        <div className="bg-white border border-border rounded-sm p-5 sm:p-6">
          <h2 className="flex items-center space-x-2 text-lg font-medium mb-4">
            <Globe size={20} className="text-accent" />
            <span>Reseaux sociaux</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Facebook (URL)</label>
              <input data-testid="setting-facebook" type="url" value={settings.facebook_url || ''} onChange={e => setSettings({...settings, facebook_url: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-sm text-sm" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instagram (URL)</label>
              <input data-testid="setting-instagram" type="url" value={settings.instagram_url || ''} onChange={e => setSettings({...settings, instagram_url: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-sm text-sm" placeholder="https://instagram.com/..." />
            </div>
          </div>
        </div>

        {/* Horaires */}
        <div className="bg-white border border-border rounded-sm p-5 sm:p-6">
          <h2 className="flex items-center space-x-2 text-lg font-medium mb-4">
            <Clock size={20} className="text-accent" />
            <span>Horaires d'ouverture</span>
          </h2>
          <div className="space-y-3">
            {jours.map(({ key, label }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b border-border last:border-0">
                <div className="w-28 font-medium text-sm">{label}</div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox" checked={horaires[key]?.ouvert ?? true}
                    onChange={e => updateHoraire(key, 'ouvert', e.target.checked)}
                    className="accent-accent"
                  />
                  <span className="text-sm">{horaires[key]?.ouvert ? 'Ouvert' : 'Ferme'}</span>
                </label>
                {horaires[key]?.ouvert && (
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="time" value={horaires[key]?.ouverture || '09:00'} onChange={e => updateHoraire(key, 'ouverture', e.target.value)}
                      className="px-2 py-1 border border-input rounded-sm" />
                    <span>-</span>
                    <input type="time" value={horaires[key]?.fermeture || '19:00'} onChange={e => updateHoraire(key, 'fermeture', e.target.value)}
                      className="px-2 py-1 border border-input rounded-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
