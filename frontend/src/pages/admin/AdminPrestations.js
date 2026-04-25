import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function AdminPrestations() {
  const { getAuthHeaders } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingPrestation, setEditingPrestation] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    duree_minutes: 60,
    prix_euros: 0,
    description: ''
  });

  useEffect(() => {
    fetchPrestations();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/categories`);
      const data = response.data;
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchPrestations = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/prestations`);
      setPrestations(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrestation) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/prestations/${editingPrestation.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/prestations`,
          formData,
          { headers: getAuthHeaders() }
        );
      }
      fetchPrestations();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette prestation ?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/prestations/${id}`,
        { headers: getAuthHeaders() }
      );
      fetchPrestations();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const openModal = (prestation = null) => {
    if (prestation) {
      setEditingPrestation(prestation);
      setFormData({
        nom: prestation.nom,
        categorie: prestation.categorie,
        duree_minutes: prestation.duree_minutes,
        prix_euros: prestation.prix_euros,
        description: prestation.description
      });
    } else {
      setEditingPrestation(null);
      setFormData({
        nom: '',
        categorie: categories.length > 0 ? categories[0] : '',
        duree_minutes: 60,
        prix_euros: 0,
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setFormData(prev => ({ ...prev, categorie: trimmed }));
    }
    setNewCategory('');
    setShowCategoryModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPrestation(null);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Gestion des Prestations</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCategoryModal(true)}
              data-testid="create-category-btn"
              className="flex items-center space-x-2 border border-accent text-accent px-4 py-2 rounded-sm hover:bg-accent/10"
            >
              <Plus size={20} />
              <span>Nouvelle catégorie</span>
            </button>
            <button
              onClick={() => openModal()}
              data-testid="create-prestation-btn"
              className="flex items-center space-x-2 bg-accent text-accent-foreground px-4 py-2 rounded-sm hover:opacity-90"
            >
              <Plus size={20} />
              <span>Nouvelle prestation</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Nom</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Catégorie</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Durée</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Prix</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prestations.map((prestation) => (
                <tr key={prestation.id}>
                  <td className="px-6 py-4">{prestation.nom}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                      {prestation.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4">{prestation.duree_minutes} min</td>
                  <td className="px-6 py-4">{prestation.prix_euros}€</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openModal(prestation)}
                      className="text-accent hover:text-accent/80 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(prestation.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif">
                  {editingPrestation ? 'Modifier' : 'Nouvelle'} Prestation
                </h2>
                <button onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Durée (minutes)</label>
                    <input
                      type="number"
                      value={formData.duree_minutes}
                      onChange={(e) => setFormData({ ...formData, duree_minutes: parseInt(e.target.value) })}
                      required
                      className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prix_euros}
                      onChange={(e) => setFormData({ ...formData, prix_euros: parseFloat(e.target.value) })}
                      required
                      className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-border rounded-sm hover:bg-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-sm hover:opacity-90"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif">Nouvelle Catégorie</h2>
                <button onClick={() => setShowCategoryModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de la catégorie</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    data-testid="new-category-input"
                    placeholder="Ex: Maquillage, Soins du corps..."
                    className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                </div>
                {categories.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Catégories existantes :</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <span key={cat} className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 border border-border rounded-sm hover:bg-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    data-testid="save-category-btn"
                    disabled={!newCategory.trim()}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-sm hover:opacity-90 disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}