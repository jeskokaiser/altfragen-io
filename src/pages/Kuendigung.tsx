import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  berlinToday,
  confirmationLines,
  CONTRACTS,
  type Contract,
  type Kind,
  KINDS,
  parseCancellationRequest,
} from '../../supabase/functions/_shared/cancellation';

const FALLBACK_ERROR =
  'Die Kündigung konnte nicht übermittelt werden. Bitte kündige per E-Mail an premium@altfragen.io.';

// The confirmation page of § 312k BGB: reachable without a login from the footer.
const Kuendigung = () => {
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | ''>('');
  const [kind, setKind] = useState<Kind>('ordinary');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [timing, setTiming] = useState<'earliest' | 'date'>('earliest');
  const [endOn, setEndOn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ lines: string[]; confirmationSent: boolean } | null>(
    null,
  );
  const today = berlinToday(new Date());

  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email || '');
  }, [user?.email]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const request = {
      email,
      name,
      contract,
      kind,
      reason,
      endOn: timing === 'date' ? endOn : null,
    };
    const parsed = parseCancellationRequest(request, today);
    if ('error' in parsed) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    const { data, error: invokeError } = await supabase.functions.invoke('submit-cancellation', {
      body: request,
    });
    setSubmitting(false);
    if (invokeError || !data?.receivedAt) {
      const detail = await invokeError?.context?.json?.().catch(() => null);
      setError(detail?.error ?? FALLBACK_ERROR);
      return;
    }
    setReceipt({
      lines: confirmationLines(parsed.value, new Date(data.receivedAt)),
      confirmationSent: data.confirmationSent === true,
    });
  };

  if (receipt) {
    return (
      <div className="bg-background px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
                Deine Kündigung ist eingegangen
              </h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Abgegeben über die Schaltfläche „jetzt kündigen“ auf altfragen.io.</p>
              <ul className="list-disc pl-6 space-y-1">
                {receipt.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p>
                {receipt.confirmationSent
                  ? `Eine Bestätigung haben wir an ${email.trim().toLowerCase()} geschickt.`
                  : 'Die Bestätigung per E-Mail konnte gerade nicht verschickt werden. Bitte speichere diese Seite als Nachweis; wir melden uns bei dir.'}
              </p>
              <Button type="button" variant="outline" onClick={() => window.print()}>
                Bestätigung drucken oder als PDF speichern
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">Verträge kündigen</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6" noValidate>
              <p className="text-sm text-muted-foreground">
                Hier kündigst du dein Premium-Abo oder Lifetime Premium, auch ohne Login. Dein
                kostenloses Konto kannst du in den Einstellungen löschen.
              </p>

              <fieldset className="space-y-2">
                <legend className="font-medium">Welchen Vertrag willst du kündigen?</legend>
                <RadioGroup value={contract} onValueChange={(v) => setContract(v as Contract)}>
                  {(Object.keys(CONTRACTS) as Contract[]).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <RadioGroupItem value={key} id={`contract-${key}`} />
                      <Label htmlFor={`contract-${key}`}>{CONTRACTS[key]}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="font-medium">Art der Kündigung</legend>
                <RadioGroup value={kind} onValueChange={(v) => setKind(v as Kind)}>
                  {(Object.keys(KINDS) as Kind[]).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <RadioGroupItem value={key} id={`kind-${key}`} />
                      <Label htmlFor={`kind-${key}`}>{KINDS[key]}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {kind === 'extraordinary' && (
                  <div className="space-y-1 pt-2">
                    <Label htmlFor="reason">Kündigungsgrund</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={2000}
                      required
                    />
                  </div>
                )}
              </fieldset>

              <div className="space-y-1">
                <Label htmlFor="email">E-Mail-Adresse deines Kontos</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Daran erkennen wir deinen Vertrag, und dorthin schicken wir die Bestätigung.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="name">Name (freiwillig)</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="font-medium">Wann soll der Vertrag enden?</legend>
                <RadioGroup
                  value={timing}
                  onValueChange={(v) => setTiming(v as 'earliest' | 'date')}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="earliest" id="timing-earliest" />
                    <Label htmlFor="timing-earliest">Zum frühestmöglichen Zeitpunkt</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="date" id="timing-date" />
                    <Label htmlFor="timing-date">Zu einem bestimmten Datum</Label>
                  </div>
                </RadioGroup>
                {timing === 'date' && (
                  <Input
                    type="date"
                    aria-label="Datum, zu dem der Vertrag enden soll"
                    min={today}
                    value={endOn}
                    onChange={(e) => setEndOn(e.target.value)}
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Frühestmöglich heißt beim Monatsabo zum Ende des laufenden Monats, beim
                  Semesterabo zum Ende der ersten sechs Monate und danach mit einer Frist von einem
                  Monat (AGB § 5).
                </p>
              </fieldset>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={submitting}>
                jetzt kündigen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Kuendigung;
