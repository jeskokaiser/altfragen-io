import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/passwordRules';
import { cn } from '@/lib/utils';

/** The password rules, ticked off while typing. Link the field to it with aria-describedby={id}. */
export const PasswordChecklist = ({ id, password }: { id: string; password: string }) => (
  <ul id={id} aria-label="Passwortregeln" className="grid gap-1 text-sm sm:grid-cols-2">
    {PASSWORD_RULES.map(({ label, test }) => {
      const ok = test(password);
      return (
        <li
          key={label}
          className={cn(
            'flex items-center gap-2',
            ok ? 'text-success-strong' : 'text-muted-foreground',
          )}
        >
          {ok ? (
            <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
          ) : (
            <Circle aria-hidden="true" className="h-4 w-4 shrink-0" />
          )}
          {label}
          <span className="sr-only">{ok ? ': erfüllt' : ': fehlt noch'}</span>
        </li>
      );
    })}
  </ul>
);
