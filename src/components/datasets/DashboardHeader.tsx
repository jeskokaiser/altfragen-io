import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DashboardHeader: React.FC = () => {
  const handleDeleteAccount = async () => {
    try {
      // Delete user data (RLS policies will ensure only user's own data is deleted)
      await supabase.from('user_progress').delete().neq('id', '');
      await supabase.from('questions').delete().neq('id', '');
      await supabase.from('profiles').delete().neq('id', '');
      
      // Delete the user's account
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      toast.success('Account successfully deleted');
    } catch (error: any) {
      toast.error('Error deleting account: ' + error.message);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <div className="space-x-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={() => supabase.auth.signOut()}>Logout</Button>
      </div>
    </div>
  );
};

export default DashboardHeader;