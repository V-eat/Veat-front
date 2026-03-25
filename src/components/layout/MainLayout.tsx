/**
 * Layout principal de l'application
 * 
 * Composant de layout qui enveloppe toutes les pages principales de l'application.
 * Fournit la structure de base avec Header, Footer et la zone de contenu principal.
 * Utilisé par React Router pour les routes qui nécessitent le layout complet.
 */

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
