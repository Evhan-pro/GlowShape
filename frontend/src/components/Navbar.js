import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './css/navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/prestations', label: 'Prestations' },
    { path: '/avant-apres', label: 'Avant/Après' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container-custom navbar-container navbar-padding">
        <div className="flex items-center justify-between">
          <Link to="/" data-testid="logo-link" className="flex items-center">
            <img
              src="/logo_glowshape.png"
              alt="Glow and Shape"
              className="logo-glowshape w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === link.path
                    ? 'text-accent'
                    : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/reservation"
              data-testid="nav-cta-reservation"
              className="btn-primary px-6 py-2 bg-accent text-accent-foreground rounded-sm font-medium hover:bg-accent/90"
            >
              Réserver
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            data-testid="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div data-testid="mobile-menu" className="md:hidden mt-4 pt-4 border-t border-border bg-background/95 backdrop-blur-md -mx-6 px-6 pb-6 rounded-b-lg shadow-lg">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors py-2 ${
                    location.pathname === link.path
                      ? 'text-accent'
                      : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/reservation"
                data-testid="mobile-nav-cta-reservation"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-primary px-6 py-3 bg-accent text-accent-foreground rounded-sm font-medium text-center"
              >
                Réserver
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}