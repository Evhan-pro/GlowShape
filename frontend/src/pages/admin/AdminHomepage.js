import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUploader from '../../components/ImageUploader';
import { Save, Type, FileText } from 'lucide-react';

export default function AdminHomepage() {
  const { getAuthHeaders } = useAuth();
  const [content, setContent] = useState({
    hero_titre: '',
    hero_sous_titre: '',
    hero_image: '',
    about_titre: '',
    about_texte: '',
    about_image: '',
    cta_titre: '',
    cta_texte: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/homepage-content`,
        { headers: getAuthHeaders() }
      );
      setContent(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (field, value) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/homepage-content`,
        content,
        { headers: getAuthHeaders() }
      );
      setMessage('Contenu enregistré avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Gestion de la Page d'Accueil</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="save-homepage-btn"
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

        <div className="space-y-8">
          {/* Section Hero */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Type className="text-accent" size={24} />
              <h2 className="text-xl font-serif">Section Hero (Bannière principale)</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre principal</label>
                  <input
                    type="text"
                    value={content.hero_titre}
                    onChange={(e) => handleChange('hero_titre', e.target.value)}
                    data-testid="hero-titre-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="L'Élégance au Naturel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sous-titre</label>
                  <input
                    type="text"
                    value={content.hero_sous_titre}
                    onChange={(e) => handleChange('hero_sous_titre', e.target.value)}
                    data-testid="hero-sous-titre-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Découvrez un havre de beauté..."
                  />
                </div>
              </div>
              <ImageUploader
                label="Image Hero"
                value={content.hero_image}
                onChange={(url) => handleChange('hero_image', url)}
              />
            </div>
          </div>

          {/* Section À Propos */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="text-accent" size={24} />
              <h2 className="text-xl font-serif">Section À Propos</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Titre</label>
                <input
                  type="text"
                  value={content.about_titre}
                  onChange={(e) => handleChange('about_titre', e.target.value)}
                  data-testid="about-titre-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="À Propos de Notre Institut"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Texte descriptif</label>
                <textarea
                  value={content.about_texte}
                  onChange={(e) => handleChange('about_texte', e.target.value)}
                  data-testid="about-texte-input"
                  rows={4}
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Depuis plus de 10 ans..."
                />
              </div>
              <ImageUploader
                label="Image À Propos"
                value={content.about_image}
                onChange={(url) => handleChange('about_image', url)}
              />
            </div>
          </div>

          {/* Section CTA Final */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Type className="text-accent" size={24} />
              <h2 className="text-xl font-serif">Section Appel à l'Action (CTA)</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Titre</label>
                <input
                  type="text"
                  value={content.cta_titre}
                  onChange={(e) => handleChange('cta_titre', e.target.value)}
                  data-testid="cta-titre-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Prête à Vous Offrir un Moment de Bien-Être ?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Texte</label>
                <textarea
                  value={content.cta_texte}
                  onChange={(e) => handleChange('cta_texte', e.target.value)}
                  data-testid="cta-texte-input"
                  rows={2}
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Réservez dès maintenant..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
