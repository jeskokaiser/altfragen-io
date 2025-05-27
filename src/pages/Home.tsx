
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to ExamTrainer</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your AI-powered learning companion for exam preparation
        </p>
        <Button onClick={() => navigate('/dashboard')} size="lg">
          Get Started
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Smart Training</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Practice with AI-generated questions tailored to your learning needs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaborative Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Study with peers in real-time collaborative exam sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Commentary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Get detailed explanations and insights powered by advanced AI models
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
