import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">V</span>
              </div>
              <span className="text-xl font-bold">V'EAT</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Commandez à l'avance et profitez de vos repas sans attente. L'expérience restaurant réinventée.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/70 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/restaurants" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Restaurants
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/70 hover:text-primary transition-colors text-sm">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/partner" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Devenir partenaire
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-background/70 hover:text-primary transition-colors text-sm">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-background/70 text-sm">
                <Mail className="h-4 w-4" />
                contact@veat.fr
              </li>
              <li className="flex items-center gap-2 text-background/70 text-sm">
                <Phone className="h-4 w-4" />
                01 23 45 67 89
              </li>
              <li className="flex items-start gap-2 text-background/70 text-sm">
                <MapPin className="h-4 w-4 mt-0.5" />
                123 Avenue des Gourmets<br />75001 Paris, France
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-background/50 text-sm">
          <p>© {new Date().getFullYear()} V'EAT. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
