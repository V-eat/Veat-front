# API Endpoints (Backend Séparé)

- Base URL: `/api`
- Auth: JWT dans l'en-tête `Authorization: Bearer <token>` sauf endpoints publics.
- Formats d'erreur attendus:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Description",
      "details": {}
    }
  }
  ```

## 1) Authentification (`/auth`)
| Méthode | Endpoint | Corps / Query | Réponse | Notes |
| --- | --- | --- | --- | --- |
| POST | /auth/register | body: `{ email, password, first_name, last_name, role? }` | `{ user, session }` | `role`: `client` \| `restaurateur` (défaut client) |
| POST | /auth/login | body: `{ email, password }` | `{ user, session }` | |
| POST | /auth/logout | headers: `Authorization` | `{ success: true }` | Requiert token |
| POST | /auth/reset-password | body: `{ email }` | `{ success: true }` | Envoi email de reset |
| GET | /auth/session | headers: `Authorization` | `{ session }` | Vérifie la session |

## 2) Profils (`/profiles`)
| Méthode | Endpoint | Corps / Params | Réponse | Notes |
| --- | --- | --- | --- | --- |
| GET | /profiles/:userId | params: `userId` | `Profile` | |
| PATCH | /profiles/:userId | body: champs partiels de `Profile` | `Profile` | `date_of_birth`, `avatar_url`, `allergies[]`, `preferences[]` optionnels |
| GET | /profiles/:userId/role | params: `userId` | `{ role }` | `role`: `client` \| `restaurateur` \| `admin` |

## 3) Restaurants (`/restaurants`)
| Méthode | Endpoint | Corps / Query | Réponse | Notes |
| --- | --- | --- | --- | --- |
| GET | /restaurants | query: `cuisineType?`, `priceRange?`, `search?` | `Restaurant[]` | Filtrage + tri rating desc |
| GET | /restaurants/:id | params: `id` | `Restaurant` | |
| GET | /restaurants/owner/:ownerId | params: `ownerId` | `Restaurant[]` | Restaurants par propriétaire |
| POST | /restaurants | body: `owner_id, name, description?, image_url?, cuisine_type?, email, phone, address, opening_hours(obj), preparation_time, price_range, is_active` | `Restaurant` | Création |
| PATCH | /restaurants/:id | body: champs partiels de `Restaurant` | `Restaurant` | Mise à jour |

## 4) Menu Items (`/menu-items`)
| Méthode | Endpoint | Corps / Params | Réponse | Notes |
| --- | --- | --- | --- | --- |
| GET | /menu-items/restaurant/:restaurantId | params: `restaurantId` | `MenuItem[]` | Tri par catégorie puis nom |
| POST | /menu-items | body: `restaurant_id, name, description?, price, image_url?, category, allergens[], is_available` | `MenuItem` | Création |
| PATCH | /menu-items/:id | body: champs partiels de `MenuItem` | `MenuItem` | Mise à jour |
| DELETE | /menu-items/:id | params: `id` | `{ success: true }` | Suppression |

## 5) Commandes (`/orders`)
| Méthode | Endpoint | Corps / Params | Réponse | Notes |
| --- | --- | --- | --- | --- |
| GET | /orders/user/:userId | params: `userId` | `Order[]` | Commandes client |
| GET | /orders/restaurant/:restaurantId | params: `restaurantId` | `Order[]` | Commandes d'un resto |
| POST | /orders | body: `user_id?, restaurant_id, items[], total_amount, arrival_time, table_number?, is_rushed, special_instructions?, status?` | `Order` | `status` défaut `pending` |
| PATCH | /orders/:id/status | body: `{ status }` | `Order` | `status`: `pending`\|`confirmed`\|`preparing`\|`ready`\|`completed`\|`cancelled` |
| POST | /orders/:id/cancel | params: `id` | `Order` | Force `status=cancelled` |

`OrderItem` shape:
```json
{
  "menuItemId": "string",
  "name": "string",
  "price": 0,
  "quantity": 1,
  "specialInstructions": "string?"
}
```

## 6) Favoris (`/favorites`)
| Méthode | Endpoint | Corps / Query | Réponse | Notes |
| --- | --- | --- | --- | --- |
| GET | /favorites/user/:userId | params: `userId` | `Favorite[]` (incl. restaurants) | Liste des favoris |
| GET | /favorites/check | query: `userId`, `restaurantId` | `{ isFavorite: boolean }` | Vérifie le statut |
| POST | /favorites | body: `{ user_id, restaurant_id }` | `Favorite` | Ajout |
| DELETE | /favorites | query: `userId`, `restaurantId` | `{ success: true }` | Suppression |

## 7) Avis (`/reviews`)
| Méthode | Endpoint | Corps / Params | Réponse | Notes |
| --- | --- | --- | --- | --- |
| GET | /reviews/restaurant/:restaurantId | params: `restaurantId` | `Review[]` (avec profils) | Tri par `created_at` desc |
| POST | /reviews | body: `{ user_id, restaurant_id, rating, comment? }` | `Review` | Création |
| PATCH | /reviews/:id | body: `{ rating?, comment? }` | `Review` | Mise à jour |
| DELETE | /reviews/:id | params: `id` | `{ success: true }` | Suppression |

## 8) Sécurité & Rôles
- Ajouter un middleware d'auth pour toutes les routes protégées.
- Vérifier les rôles `client` / `restaurateur` / `admin` pour les actions sensibles (création/édition restaurant, gestion commandes, modération avis).

## 9) Codes HTTP attendus
- 200: succès
- 201: ressource créée
- 400: requête invalide
- 401: non authentifié
- 403: interdit
- 404: non trouvé
- 500: erreur serveur
