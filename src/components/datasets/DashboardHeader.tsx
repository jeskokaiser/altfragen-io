import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <Button onClick={() => supabase.auth.signOut()}>Abmelden</Button>
    </div>
  );
};

export default DashboardHeader;