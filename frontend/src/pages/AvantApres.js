import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, ArrowRight, X } from 'lucide-react';
import './css/AvantApres.css';


const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true }
};

export default function AvantApres() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/avant-apres`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setSliderPosition(50);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const navigateItem = (direction) => {
    const currentIndex = items.findIndex(item => item.id === selectedItem.id);
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    }
    setSelectedItem(items[newIndex]);
    setSliderPosition(50);
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    updateSliderPosition(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    updateSliderPosition(e);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    updateSliderPosition(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    updateSliderPosition(e.touches[0]);
  };

  const updateSliderPosition = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div data-testid="avant-apres-page" className="pt-24 pb-16">
      {/* Header */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container-custom px-4">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6">Nos Transformations</h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Découvrez les résultats spectaculaires obtenus grâce à nos soins experts. 
              Chaque transformation témoigne de notre engagement envers l'excellence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-6 sm:py-8">
        <div className="container-custom px-4">
          {items.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                Nos transformations arrivent bientôt !
              </p>
              <Link
                to="/reservation"
                className="inline-flex items-center btn-primary px-4 sm:px-6 py-2 bg-accent text-accent-foreground rounded-sm text-sm sm:text-base"
              >
                Réserver un soin
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 justify-items-center mx-auto max-w-6xl">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  data-testid={`transformation-card-${index}`}
                  className="group cursor-pointer"
                  onClick={() => openModal(item)}
                >
                  <div className="relative bg-white border border-border rounded-sm overflow-hidden hover-lift">
                    {/* Images comparison */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div className="absolute inset-0 grid grid-cols-2">
                        <div className="relative overflow-hidden">
                         <img
                            src={item.image_avant}
                            className="preview-image"
                            alt="Avant"
                          />

                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            Avant
                          </div>
                        </div>
                        <div className="relative overflow-hidden">
                          <img
                            src={item.image_apres}
                            className="preview-image"
                            alt="Après"
                          />
                          <div className="absolute bottom-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
                            Après
                          </div>
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-foreground px-4 py-2 rounded-sm font-medium">
                          Comparer
                        </span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-serif text-lg mb-1">{item.titre}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="container-custom px-4">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-4 sm:mb-6">
              Prête pour votre transformation ?
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Nos expertes sont à votre écoute pour vous accompagner vers la meilleure version de vous-même.
            </p>
            <Link
              to="/reservation"
              data-testid="avant-apres-cta-button"
              className="inline-flex items-center btn-primary px-6 sm:px-8 py-2.5 sm:py-3 bg-accent text-accent-foreground rounded-sm font-medium space-x-2 hover:shadow-hover text-sm sm:text-base"
            >
              <span>Réserver maintenant</span>
              <ChevronRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Modern Slider Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 p-4 sm:p-6 md:p-8"
          onClick={closeModal}
        >
        <div className="w-full h-full flex items-center justify-center overflow-auto">
            <div 
              className="relative inline-block w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute -top-2 -right-2 sm:top-4 sm:right-4 z-10 text-white/80 hover:text-white transition-colors bg-black/50 rounded-full p-2"

              >
                <X size={24} />
              </button>

              {/* Title */}
              <div className="text-center mb-4 sm:mb-6 px-4">
                <h3 className="text-xl sm:text-2xl font-serif text-white mb-2">{selectedItem.titre}</h3>
                {selectedItem.description && (
                  <p className="text-white/70 max-w-xl mx-auto text-sm sm:text-base">{selectedItem.description}</p>
                )}
              </div>

              {/* Comparison Slider */}
              <div 
                ref={sliderRef}
                className="relative modal-slider cursor-ew-resize select-none mx-auto"
                style={{ maxWidth: '90vw', maxHeight: '60vh' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* After Image (Background) */}
                <img
                  src={selectedItem.image_apres}
                  alt="Après"
                  className="modal-img w-full h-full object-contain"
                  draggable="false"
                />
                
                {/* Before Image (Clipped) */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={selectedItem.image_avant}
                    alt="Avant"
                    className="modal-img w-full h-full object-contain"
                    style={{
                      width: `${100 / Math.max(0.01, sliderPosition / 100)}%`,
                      maxWidth: 'none'
                    }}
                    draggable="false"
                  />
                </div>

                {/* Slider Handle */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 sm:w-1 bg-white shadow-lg"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Handle Circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <div className="flex items-center space-x-1">
                      <ArrowLeft size={14} className="text-gray-600" />
                      <ArrowRight size={14} className="text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/70 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium">
                  Avant
                </div>
                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-accent text-accent-foreground px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium">
                  Après
                </div>
              </div>

              {/* Instructions */}
              <p className="text-center text-white/50 text-xs sm:text-sm mt-3 sm:mt-4 px-4">
                Glissez pour comparer avant et après
              </p>

              {/* Navigation */}
              {items.length > 1 && (
                <div className="flex justify-center space-x-3 sm:space-x-4 mt-4 sm:mt-6 px-4">
                  <button
                    onClick={() => navigateItem('prev')}
                    className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-colors text-sm"
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Précédent</span>
                  </button>
                  <button
                    onClick={() => navigateItem('next')}
                    className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-colors text-sm"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
