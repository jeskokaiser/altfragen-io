
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import UniversityVerification from '@/components/common/UniversityVerification';
import { fetchUniversities } from '@/services/UniversityService';
import { University } from '@/types/models/University';
import { School } from 'lucide-react';

const UniversitySettings = () => {
  const { user, profile } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const data = await fetchUniversities();
        setUniversities(data);
      } catch (error) {
        console.error('Error loading universities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUniversities();
  }, []);
  
  // Extract domain from user's email if available
  const emailDomain = user?.email ? user.email.split('@')[1] : '';
  
  // Find matching university for the user's email domain
  const matchingUniversity = emailDomain 
    ? universities.find(u => u.email_domain === emailDomain) 
    : null;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          University Settings
        </CardTitle>
        <CardDescription>
          Manage your university affiliation and access university-shared questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading university information...</p>
        ) : (
          <UniversityVerification 
            university={profile?.university || matchingUniversity} 
          />
        )}
        
        {universities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Supported Universities</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {universities.map(uni => (
                <li key={uni.id} className="flex items-center gap-1">
                  <span className="text-slate-600">•</span>
                  <span>{uni.name}</span>
                  <span className="text-xs text-slate-500">({uni.email_domain})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversitySettings;
