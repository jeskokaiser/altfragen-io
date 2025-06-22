
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DifficultyToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const DifficultyToggle: React.FC<DifficultyToggleProps> = ({ value, onValueChange, disabled = false }) => {
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ToggleGroup 
      type="single" 
      value={value}
      onValueChange={onValueChange}
      className="justify-start"
      disabled={disabled}
    >
      {[1, 2, 3, 4, 5].map((level) => (
        <ToggleGroupItem 
          key={level} 
          value={level.toString()}
          aria-label={`Schwierigkeitsgrad ${level}`}
          className={`${getDifficultyColor(level)} hover:opacity-90 transition-all ${
            value === level.toString() ? 'ring-2 ring-offset-2 ring-black' : ''
          }`}
        >
          {level}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default DifficultyToggle;
