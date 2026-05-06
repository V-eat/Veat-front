import { useState } from 'react';
import { Users, Plus, LogIn, Copy, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/useAuthContext';
import { createTable, joinTable, leaveTable } from '@/api/services/table.service';
import { toast } from 'sonner';

interface GroupTableWidgetProps {
  restaurantId: string;
}

export function GroupTableWidget({ restaurantId }: GroupTableWidgetProps) {
  const { user } = useAuth();
  const { tableId, tableCode, setTableId, setTableCode, setTableHostUserId } = useCart();
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const table = await createTable(restaurantId);
      setTableId(table.id);
      setTableCode(table.join_code);
      setTableHostUserId(table.host_user_id);
      setMode('idle');
      toast.success(`Table créée ! Code : ${table.join_code}`);
    } catch {
      toast.error('Impossible de créer la table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCodeInput.trim()) return;
    setIsLoading(true);
    try {
      const table = await joinTable(joinCodeInput.trim());
      setTableId(table.id);
      setTableCode(table.join_code);
      setTableHostUserId(table.host_user_id);
      setJoinCodeInput('');
      setMode('idle');
      toast.success('Vous avez rejoint la table !');
    } catch {
      toast.error('Code invalide ou table fermée');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!tableId) return;
    setIsLoading(true);
    try {
      await leaveTable(tableId);
      setTableId(null);
      setTableCode(null);
      setTableHostUserId(null);
      toast.success('Vous avez quitté la table');
    } catch {
      toast.error('Erreur en quittant la table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (tableCode) {
      navigator.clipboard.writeText(tableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (tableId && tableCode) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Table de groupe active</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeave} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">Code à partager :</span>
          <span className="text-lg font-bold tracking-widest text-primary font-mono">{tableCode}</span>
          <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-7 w-7 p-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Partagez ce code avec vos amis pour commander ensemble
        </p>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Créer une table de groupe
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Un code sera généré pour que vos amis puissent rejoindre.
        </p>
        <div className="flex gap-2">
          <Button variant="hero" size="sm" onClick={handleCreate} disabled={isLoading} className="flex-1">
            {isLoading ? 'Création...' : 'Créer la table'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMode('idle')}>Annuler</Button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <LogIn className="h-4 w-4 text-primary" />
          Rejoindre une table
        </h3>
        <Input
          placeholder="Code de table (ex: AB12CD)"
          value={joinCodeInput}
          onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
          className="mb-2 font-mono"
          maxLength={6}
        />
        <div className="flex gap-2">
          <Button variant="hero" size="sm" onClick={handleJoin} disabled={isLoading || !joinCodeInput} className="flex-1">
            {isLoading ? 'Connexion...' : 'Rejoindre'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMode('idle')}>Annuler</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setMode('create')} className="flex-1 gap-2">
        <Plus className="h-4 w-4" />
        Créer une table
      </Button>
      <Button variant="outline" size="sm" onClick={() => setMode('join')} className="flex-1 gap-2">
        <LogIn className="h-4 w-4" />
        Rejoindre
      </Button>
    </div>
  );
}
