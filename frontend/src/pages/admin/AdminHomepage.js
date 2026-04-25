import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUploader from '../../components/ImageUploader';
import { Save, Type, FileText, HelpCircle, Plus, Trash2 } from 'lucide-react';

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
    cta_texte: '',
    faq_items: []
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
      const data = response.data;
      setContent({
        ...data,
        faq_items: Array.isArray(data.faq_items) ? data.faq_items : []
      });
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

  const addFaqItem = () => {
    setContent(prev => ({
      ...prev,
      faq_items: [...(prev.faq_items || []), { question: '', answer: '' }]
    }));
  };

  const updateFaqItem = (index, field, value) => {
    setContent(prev => {
      const items = [...(prev.faq_items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, faq_items: items };
    });
  };

  const removeFaqItem = (index) => {
    setContent(prev => ({
      ...prev,
      faq_items: (prev.faq_items || []).filter((_, i) => i !== index)
    }));
  };

  const faqItems = Array.isArray(content.faq_items) ? content.faq_items : [];

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
                    value={content.hero_titre || ''}
                    onChange={(e) => handleChange('hero_titre', e.target.value)}
                    data-testid="hero-titre-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sous-titre</label>
                  <textarea
                    value={content.hero_sous_titre || ''}
                    onChange={(e) => handleChange('hero_sous_titre', e.target.value)}
                    data-testid="hero-sous-titre-input"
                    rows={2}
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                  value={content.about_titre || ''}
                  onChange={(e) => handleChange('about_titre', e.target.value)}
                  data-testid="about-titre-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Texte descriptif</label>
                <textarea
                  value={content.about_texte || ''}
                  onChange={(e) => handleChange('about_texte', e.target.value)}
                  data-testid="about-texte-input"
                  rows={4}
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                  value={content.cta_titre || ''}
                  onChange={(e) => handleChange('cta_titre', e.target.value)}
                  data-testid="cta-titre-input"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Texte</label>
                <textarea
                  value={content.cta_texte || ''}
                  onChange={(e) => handleChange('cta_texte', e.target.value)}
                  data-testid="cta-texte-input"
                  rows={2}
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section FAQ */}
          <div className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <HelpCircle className="text-accent" size={24} />
                <h2 className="text-xl font-serif">Questions Fréquentes (FAQ)</h2>
              </div>
              <button
                type="button"
                onClick={addFaqItem}
                data-testid="add-faq-btn"
                className="flex items-center space-x-2 border border-accent text-accent px-3 py-1.5 rounded-sm text-sm hover:bg-accent/10"
              >
                <Plus size={16} />
                <span>Ajouter</span>
              </button>
            </div>

            {faqItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune question FAQ. Cliquez sur "Ajouter" pour créer une question.
              </p>
            ) : (
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-border rounded-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Question {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        data-testid={`remove-faq-${index}`}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={item.question || ''}
                        onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                        data-testid={`faq-question-${index}`}
                        placeholder="Question..."
                        className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      />
                      <textarea
                        value={item.answer || ''}
                        onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                        data-testid={`faq-answer-${index}`}
                        placeholder="Réponse..."
                        rows={2}
                        className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
