import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUploader from '../../components/ImageUploader';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminAvantApres() {
  const { getAuthHeaders } = useAuth();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    image_avant: '',
    image_apres: '',
    ordre: 0,
    actif: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/avant-apres`,
        { headers: getAuthHeaders() }
      );
      setItems(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        titre: item.titre,
        description: item.description || '',
        image_avant: item.image_avant,
        image_apres: item.image_apres,
        ordre: item.ordre,
        actif: item.actif
      });
    } else {
      setEditingItem(null);
      setFormData({
        titre: '',
        description: '',
        image_avant: '',
        image_apres: '',
        ordre: items.length,
        actif: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      titre: '',
      description: '',
      image_avant: '',
      image_apres: '',
      ordre: 0,
      actif: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/avant-apres/${editingItem.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/avant-apres`,
          formData,
          { headers: getAuthHeaders() }
        );
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/avant-apres/${item.id}`,
        { ...item, actif: !item.actif },
        { headers: getAuthHeaders() }
      );
      fetchItems();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/avant-apres/${id}`,
        { headers: getAuthHeaders() }
      );
      fetchItems();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const updateOrder = async (item, direction) => {
    const newOrder = direction === 'up' ? item.ordre - 1 : item.ordre + 1;
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/avant-apres/${item.id}`,
        { ...item, ordre: newOrder },
        { headers: getAuthHeaders() }
      );
      fetchItems();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Photos Avant/Après</h1>
          <button
            onClick={() => openModal()}
            data-testid="add-avant-apres-btn"
            className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-border rounded-sm p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucune photo avant/après pour le moment</p>
            <button
              onClick={() => openModal()}
              className="text-accent hover:underline"
            >
              Ajouter votre première transformation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div
                key={item.id}
                data-testid={`avant-apres-card-${index}`}
                className={`bg-white border rounded-sm overflow-hidden ${item.actif ? 'border-border' : 'border-red-200 bg-red-50/30'}`}
              >
                <div className="grid grid-cols-2 gap-1">
                  <div className="relative">
                    <img
                      src={item.image_avant}
                      alt="Avant"
                      className="w-full h-32 object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Avant
                    </span>
                  </div>
                  <div className="relative">
                    <img
                      src={item.image_apres}
                      alt="Après"
                      className="w-full h-32 object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
                      Après
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">{item.titre}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => updateOrder(item, 'up')}
                        disabled={index === 0}
                        className="p-1.5 hover:bg-secondary rounded disabled:opacity-30"
                        title="Monter"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => updateOrder(item, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1.5 hover:bg-secondary rounded disabled:opacity-30"
                        title="Descendre"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`p-1.5 rounded ${item.actif ? 'hover:bg-secondary' : 'hover:bg-green-100'}`}
                        title={item.actif ? 'Masquer' : 'Afficher'}
                      >
                        {item.actif ? <Eye size={16} /> : <EyeOff size={16} className="text-red-500" />}
                      </button>
                      <button
                        onClick={() => openModal(item)}
                        className="p-1.5 hover:bg-secondary rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-serif">
                  {editingItem ? 'Modifier' : 'Ajouter'} une transformation
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-secondary rounded">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre *</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    required
                    data-testid="avant-apres-titre-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex: Soin anti-âge - Résultat après 4 semaines"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    data-testid="avant-apres-description-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Décrivez la transformation..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUploader
                    label="Image Avant *"
                    value={formData.image_avant}
                    onChange={(url) => setFormData({ ...formData, image_avant: url })}
                  />
                  <ImageUploader
                    label="Image Après *"
                    value={formData.image_apres}
                    onChange={(url) => setFormData({ ...formData, image_apres: url })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="actif"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="actif" className="text-sm">Afficher sur le site</label>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-border rounded-sm hover:bg-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.image_avant || !formData.image_apres}
                    data-testid="save-avant-apres-btn"
                    className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
