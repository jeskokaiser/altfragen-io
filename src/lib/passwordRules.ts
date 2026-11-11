/** The password rules for sign-up and reset, shown as a checklist and checked before submitting. */
export const PASSWORD_RULES: { label: string; missing: string; test: (pw: string) => boolean }[] = [
  { label: 'Mindestens 8 Zeichen', missing: 'mindestens 8 Zeichen', test: (pw) => pw.length >= 8 },
  { label: 'Ein Großbuchstabe', missing: 'einen Großbuchstaben', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Ein Kleinbuchstabe', missing: 'einen Kleinbuchstaben', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Eine Zahl', missing: 'eine Zahl', test: (pw) => /\d/.test(pw) },
  // a symbol, to match the password policy configured in Supabase Auth
  {
    label: 'Ein Sonderzeichen',
    missing: 'ein Sonderzeichen',
    test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(pw),
  },
];

/** What the password still lacks, phrased to follow "Das Passwort muss … enthalten". */
export const missingPasswordRules = (pw: string) =>
  PASSWORD_RULES.filter((r) => !r.test(pw)).map((r) => r.missing);
