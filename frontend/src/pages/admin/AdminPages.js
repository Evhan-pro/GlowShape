import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Save, FileText, Loader } from 'lucide-react';

const PAGE_CONFIGS = [
  {
    key: 'prestations',
    label: 'Page Prestations',
    fields: [
      { name: 'titre', label: 'Titre de la page', type: 'text' },
      { name: 'sous_titre', label: 'Sous-titre', type: 'textarea' }
    ]
  },
  {
    key: 'avant_apres',
    label: 'Page Avant/Après',
    fields: [
      { name: 'titre', label: 'Titre de la page', type: 'text' },
      { name: 'sous_titre', label: 'Sous-titre', type: 'textarea' },
      { name: 'cta_titre', label: 'Titre CTA (bas de page)', type: 'text' },
      { name: 'cta_texte', label: 'Texte CTA', type: 'textarea' }
    ]
  },
  {
    key: 'contact',
    label: 'Page Contact',
    fields: [
      { name: 'titre', label: 'Titre de la page', type: 'text' },
      { name: 'sous_titre', label: 'Sous-titre', type: 'textarea' },
      { name: 'form_titre', label: 'Titre du formulaire', type: 'text' },
      { name: 'infos_titre', label: 'Titre section coordonnées', type: 'text' },
      { name: 'succes_titre', label: 'Titre message de succès', type: 'text' },
      { name: 'succes_texte', label: 'Texte message de succès', type: 'textarea' }
    ]
  }
];

export default function AdminPages() {
  const { getAuthHeaders } = useAuth();
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const results = {};
      for (const config of PAGE_CONFIGS) {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/page-content/${config.key}`,
          { headers: getAuthHeaders() }
        );
        results[config.key] = res.data || {};
      }
      setPages(results);
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  const handleChange = (pageKey, fieldName, value) => {
    setPages(prev => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] || {}), [fieldName]: value }
    }));
  };

  const handleSave = async (pageKey) => {
    setSaving(pageKey);
    setMessage('');
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/page-content/${pageKey}`,
        pages[pageKey] || {},
        { headers: getAuthHeaders() }
      );
      setMessage(`Page "${PAGE_CONFIGS.find(c => c.key === pageKey)?.label}" enregistrée !`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage("Erreur lors de l'enregistrement");
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center p-12"><Loader className="animate-spin" size={32} /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div data-testid="admin-pages" className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-serif">Gestion du contenu des pages</h1>

        {message && (
          <div className={`p-4 rounded-sm ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {PAGE_CONFIGS.map((config) => (
            <div key={config.key} className="bg-white border border-border rounded-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="text-accent" size={22} />
                  <h2 className="text-lg sm:text-xl font-serif">{config.label}</h2>
                </div>
                <button
                  onClick={() => handleSave(config.key)}
                  disabled={saving === config.key}
                  data-testid={`save-page-${config.key}`}
                  className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {saving === config.key ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>{saving === config.key ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {config.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={(pages[config.key] || {})[field.name] || ''}
                        onChange={(e) => handleChange(config.key, field.name, e.target.value)}
                        data-testid={`page-${config.key}-${field.name}`}
                        rows={3}
                        className="w-full px-4 py-2 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={(pages[config.key] || {})[field.name] || ''}
                        onChange={(e) => handleChange(config.key, field.name, e.target.value)}
                        data-testid={`page-${config.key}-${field.name}`}
                        className="w-full px-4 py-2 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
