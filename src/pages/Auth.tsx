import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllUsers = async () => {
    try {
      setLoading(true);
      
      // Delete all data from tables
      await supabase.from('user_progress').delete().neq('id', '');
      await supabase.from('questions').delete().neq('id', '');
      await supabase.from('profiles').delete().neq('id', '');
      
      toast({
        title: "Success",
        description: "All user data has been deleted",
      });
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Button 
          variant="destructive"
          onClick={handleDeleteAllUsers}
          disabled={loading}
          className="mb-4"
        >
          {loading ? "Deleting..." : "Delete All Users"}
        </Button>
      </div>
    </div>
  );
}