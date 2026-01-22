import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, Shield, User, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useAdmin';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const roleLabels = {
  client: { label: 'Client', icon: User, variant: 'secondary' as const },
  restaurateur: { label: 'Restaurateur', icon: Store, variant: 'default' as const },
  admin: { label: 'Admin', icon: Shield, variant: 'destructive' as const },
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.first_name.toLowerCase().includes(search.toLowerCase()) ||
    user.last_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (userId: string, role: 'client' | 'restaurateur' | 'admin') => {
    updateRole.mutate({ userId, role });
  };

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
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground">{users?.length || 0} utilisateurs inscrits</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => {
              const roleInfo = roleLabels[user.role];
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleInfo.variant} className="gap-1">
                      <roleInfo.icon className="h-3 w-3" />
                      {roleInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.user_id, 'client')}
                          disabled={user.role === 'client'}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.user_id, 'restaurateur')}
                          disabled={user.role === 'restaurateur'}
                        >
                          <Store className="h-4 w-4 mr-2" />
                          Restaurateur
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.user_id, 'admin')}
                          disabled={user.role === 'admin'}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredUsers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
