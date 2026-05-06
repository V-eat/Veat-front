import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import { Label } from '@/components/ui/forms';
import { Switch } from '@/components/ui/forms';
import { Badge } from '@/components/ui/data-display';
import { useAdminPromotions, useCreatePromotion, useDeletePromotion, useUpdatePromotion } from '@/hooks/useAdmin';

export default function AdminPromotions() {
  const { data: promotions = [], isLoading } = useAdminPromotions();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();

  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    scope: 'global' as 'global' | 'restaurant',
    restaurant_id: '',
    discount_percent: 10,
    min_order_amount: 0,
    expires_at: '',
    is_active: true,
  });

  const handleCreate = async () => {
    if (!form.title || !form.code || !form.expires_at) return;
    await createPromotion.mutateAsync({
      title: form.title,
      description: form.description || null,
      code: form.code,
      scope: form.scope,
      restaurant_id: form.scope === 'restaurant' ? form.restaurant_id || null : null,
      discount_percent: form.discount_percent,
      starts_at: null,
      expires_at: new Date(form.expires_at).toISOString(),
      min_order_amount: form.min_order_amount || null,
      is_active: form.is_active,
    });
    setForm({
      title: '',
      description: '',
      code: '',
      scope: 'global',
      restaurant_id: '',
      discount_percent: 10,
      min_order_amount: 0,
      expires_at: '',
      is_active: true,
    });
  };

  if (isLoading) {
    return <div className="h-52 rounded-lg bg-muted animate-pulse" />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Promotions</h1>
        <p className="text-muted-foreground">Crée et pilote les campagnes promotionnelles.</p>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="font-semibold">Nouvelle promotion</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Titre</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <Label>Scope</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.scope}
              onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value as 'global' | 'restaurant' }))}
            >
              <option value="global">Global</option>
              <option value="restaurant">Restaurant</option>
            </select>
          </div>
          <div>
            <Label>ID restaurant (si scope restaurant)</Label>
            <Input value={form.restaurant_id} onChange={(e) => setForm((p) => ({ ...p, restaurant_id: e.target.value }))} />
          </div>
          <div>
            <Label>Remise (%)</Label>
            <Input type="number" value={form.discount_percent} onChange={(e) => setForm((p) => ({ ...p, discount_percent: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Panier minimum (€)</Label>
            <Input type="number" value={form.min_order_amount} onChange={(e) => setForm((p) => ({ ...p, min_order_amount: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Date d'expiration</Label>
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>
        <Button onClick={() => void handleCreate()} disabled={createPromotion.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Créer la promotion
        </Button>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        {promotions.map((promo) => (
          <div key={promo.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{promo.title}</p>
                <Badge variant="outline">{promo.code}</Badge>
                <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                  {promo.is_active ? 'active' : 'inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {promo.discount_percent}% • {promo.scope} • expire le {new Date(promo.expires_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePromotion.mutate({ id: promo.id, payload: { is_active: !promo.is_active } })}
              >
                {promo.is_active ? 'Désactiver' : 'Activer'}
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePromotion.mutate(promo.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Aucune promotion créée.</div>
        )}
      </div>
    </motion.div>
  );
}
