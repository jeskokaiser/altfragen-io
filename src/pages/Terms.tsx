const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Nutzungsbedingungen</h1>
      
      <div className="prose prose-slate">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Geltungsbereich</h2>
        <p className="mb-4">
          Diese Nutzungsbedingungen gelten für die Nutzung der Plattform Altfragen.io. Mit der Nutzung unserer Dienste erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Leistungsbeschreibung</h2>
        <p className="mb-4">
          Altfragen.io ist eine Plattform zur Unterstützung der Prüfungsvorbereitung durch das Lernen mit Altfragen. Die Plattform ermöglicht das Hochladen, Bearbeiten, Teilen und Trainieren von Altfragen.
        </p>
        <p className="mb-4">
          Die Erstellung von KI-Kommentaren ist eine Funktion, die Ratenbegrenzungen unterliegt. Daher können wir nicht garantieren, dass für jede Frage ein KI-Kommentar erstellt wird. Dies gilt insbesondere für private Fragen, die auch mit einem Premium-Abonnement möglicherweise nicht verarbeitet werden. Nutzer, die eine garantierte Verarbeitung ihrer privaten Fragen benötigen, können uns unter <a href="mailto:premium@altfragen.io" className="text-blue-600 hover:underline">premium@altfragen.io</a> für ein individuelles Angebot kontaktieren.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Nutzungsrechte</h2>
        <p className="mb-4">
          Die Nutzer erhalten das nicht-exklusive, nicht übertragbare, persönliche Recht zur Nutzung der Plattform im Rahmen dieser Nutzungsbedingungen.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Pflichten der Nutzer</h2>
        <p className="mb-4">
        Die Nutzer verpflichten sich, die Plattform ausschließlich zu den vorgesehenen Zwecken zu nutzen und keine Handlungen vorzunehmen, die rechtswidrig sind oder gegen diese Nutzungsbedingungen verstoßen. Insbesondere haften die Nutzer für sämtliche urheberrechtlichen Ansprüche, die sich aus den von ihnen hochgeladenen Inhalten ergeben.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Datenschutz</h2>
        <p className="mb-4">
          Der Schutz Ihrer persönlichen Daten ist uns wichtig. Informationen zur Verarbeitung Ihrer Daten, einschließlich der Verwendung Ihrer E-Mail-Adresse für Marketingzwecke nach Ihrer Einwilligung, finden Sie in unserer <a href="/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</a>.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Haftungsausschluss</h2>
        <p className="mb-4">
          Die Nutzung der Plattform erfolgt auf eigene Gefahr. Wir übernehmen keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Änderungen der Nutzungsbedingungen</h2>
        <p className="mb-4">
          Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Die Nutzer werden über wesentliche Änderungen informiert.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Schlussbestimmungen</h2>
        <p className="mb-4">
          Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </div>
    </div>
  );
};

export default Terms;
