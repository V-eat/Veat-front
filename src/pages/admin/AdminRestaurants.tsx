import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, CheckCircle, XCircle, Star } from 'lucide-react';
import { Input } from '@/components/ui/forms';
import { Button } from '@/components/ui/forms';
import { Badge } from '@/components/ui/data-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/data-display';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/overlays';
import { useAdminRestaurants, useToggleRestaurantStatus } from '@/hooks/useAdmin';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminRestaurants() {
  const [search, setSearch] = useState('');
  const { data: restaurants, isLoading } = useAdminRestaurants();
  const toggleStatus = useToggleRestaurantStatus();

  const filteredRestaurants = restaurants?.filter(restaurant =>
    restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
          <p className="text-muted-foreground">{restaurants?.length || 0} restaurants enregistrés</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un restaurant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRestaurants?.map((restaurant) => (
              <TableRow key={restaurant.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {restaurant.image_url && (
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{restaurant.name}</p>
                      <p className="text-xs text-muted-foreground">{restaurant.cuisine_type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {restaurant.address}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{restaurant.rating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-muted-foreground text-xs">
                      ({restaurant.review_count || 0})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                    {restaurant.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(restaurant.created_at), 'dd MMM yyyy', { locale: fr })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {restaurant.is_active ? (
                        <DropdownMenuItem
                          onClick={() => toggleStatus.mutate({ 
                            restaurantId: restaurant.id, 
                            isActive: false 
                          })}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Désactiver
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => toggleStatus.mutate({ 
                            restaurantId: restaurant.id, 
                            isActive: true 
                          })}
                          className="text-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredRestaurants?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun restaurant trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
