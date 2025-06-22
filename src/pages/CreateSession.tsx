
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import CreateSessionForm from '@/components/collab/CreateSessionForm';

const CreateSession: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/collab')} 
          className="mr-2"
        >
          Zurück
        </Button>
        <h1 className="text-2xl font-bold">Neue Zusammenarbeitssitzung erstellen</h1>
      </div>

      <CreateSessionForm />
    </div>
  );
};

export default CreateSession;
