import { Badge } from '@/components/ui/badge';

interface DifficultyBadgeProps {
  difficulty: number;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={`${getDifficultyColor(difficulty)}`}>
      Schwierigkeit: {difficulty}
    </Badge>
  );
};

export default DifficultyBadge;