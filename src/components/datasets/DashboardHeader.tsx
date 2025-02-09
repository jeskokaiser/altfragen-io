import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOutAndNavigate = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Fehler beim Abmelden:', error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <Button onClick={handleSignOutAndNavigate}>Abmelden</Button>
    </div>
  );
};

export default DashboardHeader;