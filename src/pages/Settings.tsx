import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, LogOut, Moon, Palette, Settings2, Sun, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UniversitySettings from '@/components/features/settings/UniversitySettings';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useUserPreferences();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // This is a placeholder for actual account deletion logic
      toast.error('Account deletion is not implemented yet');
      // await deleteAccount();
      // navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const toggleImmediateFeedback = () => {
    updatePreferences({
      ...preferences,
      immediateFeedback: !preferences.immediateFeedback
    });
    toast.success(`Immediate feedback ${!preferences.immediateFeedback ? 'enabled' : 'disabled'}`);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !preferences.darkMode;
    updatePreferences({
      ...preferences,
      darkMode: newDarkMode
    });
    
    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success(`${newDarkMode ? 'Dark' : 'Light'} mode enabled`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-slate-600">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="space-y-6">
        <UniversitySettings />
        
        <Appearance />
        <DataManagement />
        <ThemeSettings />
        <DatasetVisibility />
        <TrainingSettings />
        <AccountSettings />
      </div>
    </div>
  );
};

// Appearance settings component
const Appearance = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  
  const toggleDarkMode = () => {
    const newDarkMode = !preferences.darkMode;
    updatePreferences({
      ...preferences,
      darkMode: newDarkMode
    });
    
    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success(`${newDarkMode ? 'Dark' : 'Light'} mode enabled`);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize how the application looks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <p className="text-sm text-slate-500">
              Switch between light and dark theme
            </p>
          </div>
          <div className="flex items-center">
            <Sun className="h-4 w-4 mr-2 text-slate-500" />
            <Switch 
              id="dark-mode" 
              checked={preferences.darkMode}
              onCheckedChange={toggleDarkMode}
            />
            <Moon className="h-4 w-4 ml-2 text-slate-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Data management component
const DataManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Data Management
        </CardTitle>
        <CardDescription>
          Manage your data and exports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Export Your Data</Label>
            <p className="text-sm text-slate-500">
              Download all your questions and progress
            </p>
          </div>
          <Button variant="outline">
            Export Data
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Import Questions</Label>
            <p className="text-sm text-slate-500">
              Upload questions from CSV or JSON
            </p>
          </div>
          <Button variant="outline">
            Import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Theme settings component
const ThemeSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Customization
        </CardTitle>
        <CardDescription>
          Customize colors and visual elements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Theme customization will be available in a future update.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Dataset visibility component
const DatasetVisibility = () => {
  const { preferences } = useUserPreferences();
  const archivedCount = preferences.archivedDatasets?.length || 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Dataset Visibility
        </CardTitle>
        <CardDescription>
          Manage which datasets are visible in your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Archived Datasets</Label>
            <p className="text-sm text-slate-500">
              {archivedCount} datasets currently archived
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/archived'}>
            Manage Archived
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Training settings component
const TrainingSettings = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  
  const toggleImmediateFeedback = () => {
    updatePreferences({
      ...preferences,
      immediateFeedback: !preferences.immediateFeedback
    });
    toast.success(`Immediate feedback ${!preferences.immediateFeedback ? 'enabled' : 'disabled'}`);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Training Settings
        </CardTitle>
        <CardDescription>
          Customize your training experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="immediate-feedback">Immediate Feedback</Label>
            <p className="text-sm text-slate-500">
              Show correct answer immediately after answering
            </p>
          </div>
          <Switch 
            id="immediate-feedback" 
            checked={preferences.immediateFeedback}
            onCheckedChange={toggleImmediateFeedback}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Account settings component
const AccountSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // This is a placeholder for actual account deletion logic
      toast.error('Account deletion is not implemented yet');
      // await deleteAccount();
      // navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          Account Actions
        </CardTitle>
        <CardDescription>
          Manage your account security and access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sign Out</Label>
            <p className="text-sm text-slate-500">
              Sign out from your current session
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-red-600">Delete Account</Label>
            <p className="text-sm text-slate-500">
              Permanently delete your account and all data
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
