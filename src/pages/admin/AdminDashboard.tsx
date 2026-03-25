import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/forms';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/layout';
import { NavLink } from '@/components/NavLink';

const menuItems = [
  { title: 'Vue d\'ensemble', url: '/admin', icon: LayoutDashboard },
  { title: 'Utilisateurs', url: '/admin/users', icon: Users },
  { title: 'Restaurants', url: '/admin/restaurants', icon: Store },
  { title: 'Commandes', url: '/admin/orders', icon: ShoppingBag },
  { title: 'Avis', url: '/admin/reviews', icon: MessageSquare },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold text-primary">V'EAT Admin</h1>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/admin'}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Retour au site
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-semibold text-lg">
              {menuItems.find(item =>
                item.url === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.url)
              )?.title || 'Administration'}
            </h2>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
