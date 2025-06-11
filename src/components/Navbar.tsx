
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { LogOut, User, Home, BookOpen, Users, Settings, Crown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold text-xl">Altfragen.io</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/collab">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Zusammenarbeit
                  </Button>
                </Link>
                <Link to="/subscription">
                  <Button variant="ghost" size="sm">
                    <Crown className={`h-4 w-4 mr-2 ${subscribed ? 'text-yellow-600' : ''}`} />
                    Premium
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Mobile navigation items - only show on smaller screens */}
                  <div className="md:hidden">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/collab')}>
                      <Users className="mr-2 h-4 w-4" />
                      Zusammenarbeit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/subscription')}>
                      <Crown className="mr-2 h-4 w-4" />
                      Premium
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                  
                  <DropdownMenuItem onClick={() => navigate('/subscription')}>
                    <Crown className="mr-2 h-4 w-4" />
                    Premium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Einstellungen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Anmelden
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
