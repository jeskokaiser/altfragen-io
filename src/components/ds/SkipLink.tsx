/** "Zum Inhalt": first focusable element of every page, visible on focus. */
export function SkipLink({ target = '#main' }: { target?: string }) {
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
    >
      Zum Inhalt
    </a>
  );
}
