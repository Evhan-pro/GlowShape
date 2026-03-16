import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, Euro } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
  viewport: { once: true }
};

export default function Prestations() {
  const [prestations, setPrestations] = useState([]);
  const [filteredPrestations, setFilteredPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [maxDuration, setMaxDuration] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPrestations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [prestations, selectedCategory, searchTerm, priceRange, maxDuration]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories`);
      const data = await response.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      console.error('Erreur:', error);
      setCategories([]);
    }
  };

  const fetchPrestations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/prestations`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setPrestations(list);
      setFilteredPrestations(list);
    } catch (error) {
      console.error('Erreur:', error);
      setPrestations([]);
      setFilteredPrestations([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...prestations];

    if (selectedCategory) {
      filtered = filtered.filter(p => p.categorie === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priceRange.min) {
      filtered = filtered.filter(p => p.prix_euros >= parseFloat(priceRange.min));
    }

    if (priceRange.max) {
      filtered = filtered.filter(p => p.prix_euros <= parseFloat(priceRange.max));
    }

    if (maxDuration) {
      filtered = filtered.filter(p => p.duree_minutes <= parseInt(maxDuration));
    }

    setFilteredPrestations(filtered);
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setMaxDuration('');
  };

  return (
    <div data-testid="prestations-page" className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="container-custom text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-4"
          >
            Nos Prestations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto"
          >
            Découvrez notre large gamme de soins personnalisés
          </motion.p>
        </div>
      </section>

      <div className="container-custom py-8 sm:py-12">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4 px-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-accent text-accent-foreground rounded-sm font-medium"
          >
            <Filter size={20} />
            <span>{showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Filtres */}
          <aside data-testid="filters-sidebar" className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-border rounded-sm p-4 sm:p-6 lg:sticky lg:top-24 mx-4 lg:mx-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif flex items-center space-x-2">
                  <Filter size={20} />
                  <span>Filtres</span>
                </h2>
                <button
                  data-testid="reset-filters-button"
                  onClick={resetFilters}
                  className="text-sm text-accent hover:underline"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Recherche */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    data-testid="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <select
                  data-testid="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Prix */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <Euro size={16} />
                  <span>Prix</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    data-testid="price-min-input"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="number"
                    data-testid="price-max-input"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <Clock size={16} />
                  <span>Durée max (min)</span>
                </label>
                <input
                  type="number"
                  data-testid="duration-max-input"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  placeholder="120"
                  className="w-full px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </aside>

          {/* Liste des prestations */}
          <div className="lg:col-span-3 px-4 lg:px-0">
            <div className="mb-4 sm:mb-6">
              <p className="text-muted-foreground text-sm sm:text-base" data-testid="results-count">
                {filteredPrestations.length} prestation(s) trouvée(s)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredPrestations.map((prestation, index) => (
                <motion.div
                  key={prestation.id}
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  data-testid={`prestation-card-${index}`}
                  className="bg-white border border-border rounded-sm overflow-hidden hover-lift"
                >
                  <div className="p-4 sm:p-6">
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs rounded-full">
                        {prestation.categorie}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif mb-2">{prestation.nom}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                      {prestation.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock size={16} />
                        <span className="text-xs sm:text-sm">{prestation.duree_minutes} min</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-serif text-accent">{prestation.prix_euros}€</span>
                    </div>
                    <Link
                      to="/reservation"
                      state={{ prestationId: prestation.id }}
                      data-testid={`book-button-${index}`}
                      className="block text-center btn-primary px-4 py-2 bg-accent text-accent-foreground rounded-sm text-sm font-medium"
                    >
                      Réserver
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredPrestations.length === 0 && (
              <div data-testid="no-results" className="text-center py-12">
                <p className="text-muted-foreground text-sm sm:text-base">Aucune prestation ne correspond à vos critères.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}