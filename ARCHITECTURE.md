# Architecture du projet V'EAT

## Vue d'ensemble

Ce document décrit l'architecture du projet V'EAT, une application de commande de repas en ligne avec gestion de restaurants.

## Structure des dossiers

```
src/
├── api/                    # Couche d'accès aux données (services API)
│   └── services/          # Services métier pour chaque domaine
│       ├── auth.service.ts
│       ├── orders.service.ts
│       ├── restaurants.service.ts
│       ├── menuItems.service.ts
│       ├── reviews.service.ts
│       └── favorites.service.ts
│
├── components/            # Composants React réutilisables
│   ├── layout/           # Composants de layout (Header, Footer, MainLayout)
│   ├── restaurant/       # Composants spécifiques aux restaurants
│   └── ui/               # Composants UI de base (shadcn/ui)
│
├── contexts/             # Contextes React (Auth, Cart)
│   ├── AuthContext.tsx
│   └── CartContext.tsx
│
├── hooks/                # Hooks React personnalisés
│   ├── useAuth.ts
│   ├── useOrders.ts
│   ├── useRestaurants.ts
│   ├── useMenuItems.ts
│   ├── useReviews.ts
│   └── useFavorites.ts
│
├── pages/                # Pages de l'application (routes)
│   ├── admin/           # Pages d'administration
│   └── ...
│
├── types/                # Définitions TypeScript
│   └── index.ts
│
└── integrations/         # Intégrations externes
    └── supabase/        # Configuration Supabase
```

## Architecture en couches

### 1. Couche Services (`src/api/services/`)

**Responsabilité** : Gérer toutes les interactions avec la base de données Supabase.

Les services sont des fonctions pures qui encapsulent la logique d'accès aux données. Ils ne contiennent pas de logique métier React (pas de hooks, pas de state).

**Exemple** :
```typescript
// auth.service.ts
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}
```

**Avantages** :
- Séparation claire entre logique métier et logique React
- Réutilisables dans différents contextes (hooks, composants, tests)
- Faciles à tester unitairement
- Faciles à remplacer si changement de backend

### 2. Couche Hooks (`src/hooks/`)

**Responsabilité** : Fournir des hooks React Query pour gérer le cache et les états de chargement.

Les hooks utilisent les services pour récupérer les données et gèrent :
- Le cache avec React Query
- Les états de chargement
- Les erreurs
- Les notifications toast
- L'invalidation du cache après mutations

**Exemple** :
```typescript
// useOrders.ts
export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => ordersService.getUserOrders(userId!),
    enabled: !!userId,
  });
}
```

**Avantages** :
- Abstraction de React Query pour les composants
- Gestion automatique du cache et de la synchronisation
- Optimistic updates possibles
- Retry automatique en cas d'erreur

### 3. Couche Composants (`src/components/`)

**Responsabilité** : Afficher l'interface utilisateur et gérer les interactions.

Les composants utilisent les hooks pour récupérer les données et les contextes pour l'état global (auth, cart).

**Structure** :
- `layout/` : Composants de structure (Header, Footer, MainLayout)
- `restaurant/` : Composants spécifiques aux restaurants
- `ui/` : Composants UI réutilisables (shadcn/ui)

### 4. Couche Contextes (`src/contexts/`)

**Responsabilité** : Gérer l'état global de l'application.

**Contextes disponibles** :
- `AuthContext` : État d'authentification (utilisateur, session, profil)
- `CartContext` : État du panier (articles, total, restaurant)

### 5. Couche Pages (`src/pages/`)

**Responsabilité** : Définir les routes et les pages complètes de l'application.

Les pages sont des composants qui combinent plusieurs composants plus petits pour créer une vue complète.

## Flux de données

```
Composant → Hook → Service → Supabase
                ↓
         React Query Cache
```

1. Le composant appelle un hook (ex: `useOrders()`)
2. Le hook utilise un service (ex: `ordersService.getUserOrders()`)
3. Le service fait une requête à Supabase
4. Les données sont mises en cache par React Query
5. Le composant reçoit les données via le hook

## Principes d'architecture

### Séparation des responsabilités

- **Services** : Accès aux données uniquement
- **Hooks** : Gestion du cache et des états React
- **Composants** : Affichage et interactions utilisateur
- **Contextes** : État global partagé

### Réutilisabilité

- Les services peuvent être utilisés dans différents hooks
- Les hooks peuvent être utilisés dans différents composants
- Les composants peuvent être composés pour créer des pages

### Testabilité

- Les services sont des fonctions pures, faciles à tester
- Les hooks peuvent être testés avec React Testing Library
- Les composants peuvent être testés de manière isolée

### Maintenabilité

- Code bien organisé et documenté
- Commentaires JSDoc sur tous les fichiers importants
- Types TypeScript stricts
- Structure claire et prévisible

## Technologies utilisées

- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **React Router** : Routage
- **React Query (TanStack Query)** : Gestion du cache et des requêtes
- **Supabase** : Backend as a Service (BaaS)
- **Tailwind CSS** : Styling
- **shadcn/ui** : Composants UI

## Conventions de nommage

- **Services** : `*.service.ts` (ex: `auth.service.ts`)
- **Hooks** : `use*.ts` (ex: `useAuth.ts`)
- **Composants** : `PascalCase.tsx` (ex: `Header.tsx`)
- **Types** : `PascalCase` (ex: `User`, `Order`)
- **Fonctions** : `camelCase` (ex: `getUserOrders`)

## Migration depuis Lovable

Le projet a été migré depuis Lovable où le backend était intégré dans le frontend. Les changements principaux :

1. **Séparation des services** : Toute la logique d'accès aux données a été extraite dans `src/api/services/`
2. **Refactorisation des hooks** : Les hooks utilisent maintenant les services au lieu d'accéder directement à Supabase
3. **Documentation** : Ajout de commentaires JSDoc sur tous les fichiers importants
4. **Structure claire** : Organisation en couches bien définies

## Prochaines étapes

- [ ] Ajouter des tests unitaires pour les services
- [ ] Ajouter des tests d'intégration pour les hooks
- [ ] Ajouter des tests E2E pour les flux principaux
- [ ] Mettre en place un système de logging
- [ ] Ajouter un système de monitoring des erreurs

