import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Star, FileText, ExternalLink, Clock } from 'lucide-react';
import { Input } from '@/components/ui/forms';
import { Button } from '@/components/ui/forms';
import { Badge } from '@/components/ui/data-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/data-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/data-display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays';
import { Textarea } from '@/components/ui/forms';
import { useAdminRestaurants, useApproveRestaurant, useRejectRestaurant } from '@/hooks/useAdmin';
import { AdminRestaurant } from '@/api/services/admin.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  pending:  { label: 'En attente', className: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
  approved: { label: 'Approuvé',   className: 'border-green-500 text-green-600 bg-green-50' },
  rejected: { label: 'Rejeté',     className: 'border-red-500 text-red-600 bg-red-50' },
};

function RejectDialog({
  restaurant,
  open,
  onClose,
}: {
  restaurant: AdminRestaurant;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const reject = useRejectRestaurant();

  const handleReject = () => {
    if (!reason.trim()) return;
    reject.mutate(
      { restaurantId: restaurant.id, reason },
      {
        onSuccess: () => {
          setReason('');
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeter « {restaurant.name} »</DialogTitle>
          <DialogDescription>
            Expliquez la raison du rejet. Ce motif sera conservé dans le dossier.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Ex : SIRET introuvable dans la base INSEE, Kbis illisible, activité non conforme…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-2"
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!reason.trim() || reject.isPending}
          >
            {reject.isPending ? 'Rejet en cours…' : 'Confirmer le rejet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RestaurantTable({
  restaurants,
  showActions,
}: {
  restaurants: AdminRestaurant[];
  showActions: boolean;
}) {
  const approve = useApproveRestaurant();
  const [rejectTarget, setRejectTarget] = useState<AdminRestaurant | null>(null);

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun restaurant dans cette catégorie
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Propriétaire</TableHead>
              <TableHead>SIRET</TableHead>
              <TableHead>Kbis</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.map((r) => {
              const cfg = statusConfig[r.status ?? 'pending'];
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          N/A
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.cuisine_type ?? '—'}</p>
                        {r.status === 'rejected' && r.rejection_reason && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate" title={r.rejection_reason}>
                            Motif : {r.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '—'}</p>
                      <p className="text-xs text-muted-foreground">{r.profiles?.email ?? '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{r.siret ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    {r.kbis_url ? (
                      <a
                        href={r.kbis_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        Voir
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{r.rating?.toFixed(1) ?? 'N/A'}</span>
                      <span className="text-muted-foreground text-xs">({r.review_count ?? 0})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cfg.className}>
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => approve.mutate(r.id)}
                          disabled={approve.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => setRejectTarget(r)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {rejectTarget && (
        <RejectDialog
          restaurant={rejectTarget}
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}

export default function AdminRestaurants() {
  const [search, setSearch] = useState('');
  const { data: restaurants, isLoading, error } = useAdminRestaurants();

  const filtered = (restaurants ?? []).filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.address ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.siret ?? '').includes(search)
  );

  const pending  = filtered.filter((r) => r.status === 'pending');
  const approved = filtered.filter((r) => r.status === 'approved');
  const rejected = filtered.filter((r) => r.status === 'rejected');

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
        Erreur : {(error as Error).message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
          <p className="text-muted-foreground">
            {restaurants?.length ?? 0} restaurants —{' '}
            <span className="text-yellow-600 font-medium">{pending.length} en attente</span>
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, adresse ou SIRET…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approuvés
            <Badge variant="secondary" className="ml-1">{approved.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejetés
            <Badge variant="secondary" className="ml-1">{rejected.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            Tous ({filtered.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <RestaurantTable restaurants={pending} showActions={true} />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <RestaurantTable restaurants={approved} showActions={false} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <RestaurantTable restaurants={rejected} showActions={true} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <RestaurantTable restaurants={filtered} showActions={false} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
