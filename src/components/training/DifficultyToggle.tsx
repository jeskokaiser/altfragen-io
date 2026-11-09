import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface DifficultyToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

// Colour order users know: green, blue, yellow, orange, red (difficulty-1..5 tokens).
const levelClass: Record<number, string> = {
  1: 'bg-difficulty-1 text-difficulty-1-foreground data-[state=on]:bg-difficulty-1 data-[state=on]:text-difficulty-1-foreground',
  2: 'bg-difficulty-2 text-difficulty-2-foreground data-[state=on]:bg-difficulty-2 data-[state=on]:text-difficulty-2-foreground',
  3: 'bg-difficulty-3 text-difficulty-3-foreground data-[state=on]:bg-difficulty-3 data-[state=on]:text-difficulty-3-foreground',
  4: 'bg-difficulty-4 text-difficulty-4-foreground data-[state=on]:bg-difficulty-4 data-[state=on]:text-difficulty-4-foreground',
  5: 'bg-difficulty-5 text-difficulty-5-foreground data-[state=on]:bg-difficulty-5 data-[state=on]:text-difficulty-5-foreground',
};

const DifficultyToggle: React.FC<DifficultyToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={onValueChange}
      className="justify-start gap-1.5"
      disabled={disabled}
      aria-label="Persönliche Schwierigkeit"
    >
      {[1, 2, 3, 4, 5].map((level) => (
        <ToggleGroupItem
          key={level}
          value={level.toString()}
          aria-label={`Schwierigkeitsgrad ${level}`}
          className={cn(
            'h-9 w-9 border-2 border-transparent font-semibold tabular-nums hover:opacity-90 data-[state=on]:border-foreground touch:h-11 touch:w-11',
            levelClass[level],
          )}
        >
          {level}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default DifficultyToggle;
