import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const options = [
  { value: 'system', label: 'Wie System', hint: 'Folgt der Einstellung deines Geräts' },
  { value: 'light', label: 'Hell', hint: '' },
  { value: 'dark', label: 'Dunkel', hint: '' },
];

/** Light, dark or "wie System". The toggle in the navigation stays as the quick switch. */
const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  // next-themes knows the stored theme only after mounting.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-xl font-semibold">Darstellung</h2>
      <p id="appearance-hint" className="mb-4 text-sm text-muted-foreground">
        Wie Altfragen.io aussehen soll.
      </p>
      <RadioGroup
        value={mounted ? (theme ?? 'system') : undefined}
        onValueChange={setTheme}
        aria-describedby="appearance-hint"
        className="grid gap-2 sm:grid-cols-3"
      >
        {options.map((o) => (
          <Label
            key={o.value}
            htmlFor={`theme-${o.value}`}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle"
          >
            <RadioGroupItem id={`theme-${o.value}`} value={o.value} />
            <span>
              <span className="block font-semibold">{o.label}</span>
              {o.hint && <span className="block text-xs text-muted-foreground">{o.hint}</span>}
            </span>
          </Label>
        ))}
      </RadioGroup>
    </Card>
  );
};

export default AppearanceSection;
