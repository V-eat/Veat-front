/**
 * Composant Header
 * 
 * En-tête de navigation principal de l'application.
 * Affiche :
 * - Le logo et le nom de l'application
 * - Les liens de navigation principaux (Accueil, Restaurants, Favoris)
 * - Le panier avec le nombre d'articles
 * - Le bouton de connexion/profil utilisateur
 * - Un menu mobile responsive
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, Search, Heart, ChefHat, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, isRestaurateur, viewMode, toggleViewMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/restaurants', label: 'Restaurants' },
    { to: '/favorites', label: 'Favoris', icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">V</span>
            </div>
            <span className="text-xl font-bold text-foreground">V'EAT</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mode Switch — restaurateurs only */}
            {isAuthenticated && isRestaurateur && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleViewMode}
                className={`hidden md:flex items-center gap-1.5 text-xs font-medium ${
                  viewMode === 'pro'
                    ? 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
                    : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {viewMode === 'pro' ? (
                  <><ChefHat className="h-3.5 w-3.5" /> Mode Pro</>
                ) : (
                  <><UserCircle className="h-3.5 w-3.5" /> Mode Client</>
                )}
              </Button>
            )}

            {/* Dashboard link in pro mode */}
            {isAuthenticated && isRestaurateur && viewMode === 'pro' && (
              <Link to="/dashboard" className="hidden md:block">
                <Button variant="ghost" size="sm" className="text-xs text-primary font-medium">
                  Mon restaurant
                </Button>
              </Link>
            )}

            {/* Search - Desktop only */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button variant="default" size="sm">
                  Connexion
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden pb-4"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated && isRestaurateur && (
                  <>
                    {viewMode === 'pro' && (
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}
                        className="px-4 py-3 rounded-lg text-sm font-medium text-primary bg-primary/10">
                        Mon restaurant
                      </Link>
                    )}
                    <button
                      onClick={() => { toggleViewMode(); setIsMenuOpen(false); }}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-left text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2"
                    >
                      {viewMode === 'pro' ? <><UserCircle className="h-4 w-4" /> Passer en mode client</> : <><ChefHat className="h-4 w-4" /> Passer en mode pro</>}
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="default" className="w-full mt-2">
                      Connexion
                    </Button>
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
