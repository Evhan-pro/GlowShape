import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X, Star } from 'lucide-react';

export default function AdminTemoignages() {
  const { getAuthHeaders } = useAuth();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    texte: '',
    note: 5,
    actif: true,
    ordre: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/temoignages`,
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
        nom: item.nom,
        texte: item.texte,
        note: item.note,
        actif: item.actif,
        ordre: item.ordre
      });
    } else {
      setEditingItem(null);
      setFormData({
        nom: '',
        texte: '',
        note: 5,
        actif: true,
        ordre: items.length
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/temoignages/${editingItem.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/temoignages`,
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
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/temoignages/${item.id}`,
        { ...item, actif: !item.actif },
        { headers: getAuthHeaders() }
      );
      fetchItems();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/temoignages/${id}`,
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
          <h1 className="text-3xl font-serif">Témoignages Clients</h1>
          <button
            onClick={() => openModal()}
            data-testid="add-temoignage-btn"
            className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-border rounded-sm p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun témoignage pour le moment</p>
            <button
              onClick={() => openModal()}
              className="text-accent hover:underline"
            >
              Ajouter votre premier témoignage
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div
                key={item.id}
                data-testid={`temoignage-card-${index}`}
                className={`bg-white border rounded-sm p-6 ${item.actif ? 'border-border' : 'border-red-200 bg-red-50/30'}`}
              >
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < item.note ? 'text-accent fill-accent' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic line-clamp-3">"{item.texte}"</p>
                <p className="font-medium">{item.nom}</p>
                
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-border space-x-1">
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
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-serif">
                  {editingItem ? 'Modifier' : 'Ajouter'} un témoignage
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-secondary rounded">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du client *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                    data-testid="temoignage-nom-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex: Marie L."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Témoignage *</label>
                  <textarea
                    value={formData.texte}
                    onChange={(e) => setFormData({ ...formData, texte: e.target.value })}
                    required
                    rows={4}
                    data-testid="temoignage-texte-input"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Le témoignage du client..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Note</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, note: n })}
                        className="p-1"
                      >
                        <Star
                          size={24}
                          className={n <= formData.note ? 'text-accent fill-accent' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
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
                    disabled={saving}
                    data-testid="save-temoignage-btn"
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
