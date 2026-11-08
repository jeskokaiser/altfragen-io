import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AGB = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. Geltungsbereich */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 1 Geltungsbereich</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle Verträge
                zwischen Altfragen.io, angeboten von KSR Labs, Jesko Kaiser (nachfolgend "Anbieter")
                und den Nutzern der Plattform Altfragen.io über die Nutzung der kostenpflichtigen
                Premium-Dienste (Abonnements, Lifetime Premium und KI-Credits). Für die Nutzung der
                Plattform im Übrigen gelten die{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Nutzungsbedingungen
                </a>
                ; soweit sie sich widersprechen, gehen für Premium-Dienste diese AGB vor.
              </p>
              <p>
                Anbieter:
                <br />
                KSR Labs
                <br />
                Jesko Kaiser
                <br />
                Kegelhofstr. 17
                <br />
                20251 Hamburg
                <br />
                E-Mail: hallo@altfragen.io
              </p>
            </section>

            {/* 2. Vertragsgegenstand */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 2 Vertragsgegenstand</h2>
              <p>
                Gegenstand des Vertrages ist die Bereitstellung des Premium-Zugangs zur Plattform
                Altfragen.io mit folgenden Leistungen:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Unbegrenzte Trainings-Sessions</li>
                <li>Unbegrenzte KI-Kommentare zu geteilten Fragen</li>
                <li>
                  KI-Kommentare zu privaten Fragen im Rahmen des in der App angezeigten Kontingents,
                  erweiterbar durch KI-Credits (§ 4)
                </li>
                <li>KI-verbesserte Fragen und Antworten</li>
                <li>Texterkennung (OCR) in PDF-Dateien</li>
                <li>Ausführliche Statistiken</li>
                <li>Premium-Support unter premium@altfragen.io</li>
              </ul>
              <p>Die Einschränkungen bei KI-Kommentaren nach § 6 gelten auch hier.</p>
            </section>

            {/* 3. Vertragsschluss */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 3 Vertragsschluss</h2>
              <p>
                Der Vertrag kommt durch die Bestätigung der Bestellung und die erfolgreiche Zahlung
                über unseren Zahlungsdienstleister Stripe zustande.
              </p>
              <p>
                Die Darstellung der Premium-Dienste auf unserer Website stellt kein rechtlich
                bindendes Angebot, sondern eine Aufforderung zur Abgabe einer Bestellung dar.
              </p>
            </section>

            {/* 4. Preise und Zahlungsbedingungen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 4 Preise und Zahlungsbedingungen</h2>
              <p>
                Die Preise werden nach §19 UStG versteuert, daher fällt keine Mehrwertsteuer an.
              </p>
              <p>
                Es gelten die beim Kauf angezeigten Preise. Abonnements werden je nach gewähltem
                Tarif monatlich oder pro Semester im Voraus abgerechnet; Lifetime Premium und
                KI-Credits werden einmalig bezahlt. Die Zahlung erfolgt über unseren
                Zahlungsdienstleister Stripe.
              </p>
              <p>
                <strong>KI-Credits:</strong> Nutzer mit Premium-Zugang können zusätzliche Credits
                für KI-Kommentare zu privaten Fragen in Paketen kaufen. Der Umfang eines Pakets wird
                vor dem Kauf angezeigt. Credits können nur genutzt werden, solange ein
                Premium-Zugang besteht, sind an das Nutzerkonto gebunden, nicht übertragbar und
                werden nicht ausgezahlt.
              </p>
              <p>
                <strong>Lifetime Premium Abonnement:</strong> Neben den wiederkehrenden Abonnements
                (monatlich/semestral) bietet der Anbieter optional ein "Lifetime Premium" Abonnement
                an. Dieses wird durch eine einmalige Zahlung erworben und gewährt dauerhaften Zugang
                zu den Premium-Funktionen der Plattform. Die einmalige Zahlung ist nach Ablauf der
                gesetzlichen Widerrufsfrist endgültig und nicht erstattungsfähig. Das Lifetime
                Premium Abonnement ist an das jeweilige Nutzerkonto gebunden und nicht übertragbar.
                Der Anbieter behält sich vor, das Lifetime Premium Abonnement zu bestimmten Zeiten
                als zeitlich begrenzte Promotion anzubieten.
              </p>
            </section>

            {/* 5. Laufzeit und Kündigung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 5 Laufzeit und Kündigung</h2>
              <p>
                Wiederkehrende Abonnements (monatlich/semestral) laufen auf unbestimmte Zeit und
                sind jederzeit zum Ablauf des Abrechnungszeitraums kündbar.
              </p>
              <p>
                Die Kündigung kann jederzeit über das Stripe Customer Portal in Ihrem Benutzerkonto
                oder per E-Mail an premium@altfragen.io erfolgen.
              </p>
              <p>
                <strong>Lifetime Premium Abonnement:</strong> Das Lifetime Premium Abonnement
                besteht dauerhaft für die Lebensdauer des Nutzerkontos. Eine Kündigung des Lifetime
                Premium Abonnements ist nicht erforderlich, da keine wiederkehrenden Zahlungen
                anfallen. Bei Löschung des Nutzerkontos endet auch der Zugang zum Lifetime Premium
                Abonnement. Eine Rückerstattung der einmaligen Zahlung ist nach Ablauf der
                gesetzlichen Widerrufsfrist ausgeschlossen.
              </p>
              <p>Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</p>
            </section>

            {/* 6. Leistungserbringung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 6 Leistungserbringung</h2>
              <p>
                Die Premium-Dienste stehen Ihnen unmittelbar nach erfolgreicher Zahlung zur
                Verfügung.
              </p>
              <p>
                Wir streben eine Verfügbarkeit von 99% an, können diese jedoch nicht garantieren.
                Wartungsarbeiten werden nach Möglichkeit außerhalb der Hauptnutzungszeiten
                durchgeführt.
              </p>
              <p>
                Die Erstellung von KI-generierten Kommentaren für vom Nutzer hochgeladene Fragen
                unterliegt technischen Beschränkungen und einer Fair-Use-Policy, die durch
                Ratenbegrenzungen umgesetzt wird. Der Anbieter kann daher nicht garantieren, dass
                sämtliche Fragen, insbesondere private Fragen des Nutzers, mit KI-Kommentaren
                versehen werden. Dies gilt auch im Rahmen eines Premium-Abonnements. Nutzern mit
                einem Bedarf an garantierter und vollständiger Verarbeitung ihrer privaten Fragen
                bietet der Anbieter individuelle Vereinbarungen an. Anfragen hierzu sind an
                premium@altfragen.io zu richten.
              </p>
              <p>
                <strong>Lifetime Premium Abonnement:</strong> Der Zugang zu den Premium-Funktionen
                im Rahmen des Lifetime Premium Abonnements besteht dauerhaft, solange die Plattform
                betrieben wird und das Nutzerkonto besteht. Der Anbieter behält sich vor, die
                Plattform, einzelne Funktionen oder die Art der Leistungserbringung
                weiterzuentwickeln oder anzupassen, soweit dies technisch erforderlich oder zumutbar
                ist. Der Anbieter verpflichtet sich jedoch, Lifetime Premium Nutzern dauerhaft
                Zugang zu den Premium-Funktionen zu gewähren, auch wenn sich die Preise für
                wiederkehrende Abonnements ändern sollten. Sollte der Anbieter die Plattform
                vollständig einstellen, endet auch der Zugang zum Lifetime Premium Abonnement ohne
                Anspruch auf Rückerstattung.
              </p>
            </section>

            {/* 7. Pflichten des Kunden */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 7 Pflichten des Kunden</h2>
              <p>Der Kunde verpflichtet sich:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Die Dienste nur für den persönlichen, nicht-kommerziellen Gebrauch zu nutzen
                </li>
                <li>Keine urheberrechtlich geschützten Inhalte ohne Berechtigung hochzuladen</li>
                <li>Die Zugangsdaten vertraulich zu behandeln und nicht an Dritte weiterzugeben</li>
                <li>Bei Änderung der Zahlungsdaten diese umgehend zu aktualisieren</li>
              </ul>
            </section>

            {/* 8. Haftung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 8 Haftung</h2>
              <p>
                Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des
                Körpers oder der Gesundheit, für Vorsatz und grobe Fahrlässigkeit sowie nach dem
                Produkthaftungsgesetz.
              </p>
              <p>
                Für sonstige Schäden haftet der Anbieter nur bei der Verletzung wesentlicher
                Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den
                typischen, vorhersehbaren Schaden begrenzt.
              </p>
              <p>
                Die KI-generierten Inhalte dienen ausschließlich Lernzwecken. Der Anbieter übernimmt
                keine Gewähr für die Richtigkeit oder Vollständigkeit der KI-Kommentare.
              </p>
            </section>

            {/* 9. Widerrufsrecht */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 9 Widerrufsrecht</h2>
              <p>
                Als Verbraucher haben Sie ein gesetzliches Widerrufsrecht. Die Einzelheiten finden
                Sie in unserer Widerrufsbelehrung.
              </p>
              <p>
                <strong>Wichtiger Hinweis:</strong> Das Widerrufsrecht erlischt bei digitalen
                Inhalten, wenn Sie der sofortigen Ausführung zugestimmt haben und zur Kenntnis
                genommen haben, dass Sie dadurch Ihr Widerrufsrecht verlieren.
              </p>
            </section>

            {/* 10. Datenschutz */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 10 Datenschutz</h2>
              <p>
                Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Datenschutzerklärung
                </a>
                .
              </p>
            </section>

            {/* 11. E-Mail-Kommunikation */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 11 E-Mail-Kommunikation</h2>
              <p>
                Der Anbieter ist berechtigt, dem Nutzer vertragsrelevante Informationen und
                Mitteilungen (z.B. zu Änderungen dieser AGB, technische Informationen) an die von
                ihm hinterlegte E-Mail-Adresse zu senden.
              </p>
              <p>
                Sofern der Nutzer seine gesonderte Einwilligung erteilt hat, erhält er zudem
                Marketing-E-Mails mit Informationen zu neuen Produkten, Angeboten und Neuigkeiten.
                Diese Einwilligung kann jederzeit widerrufen werden. Näheres regelt unsere{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Datenschutzerklärung
                </a>
                .
              </p>
            </section>

            {/* 12. Änderungen der AGB */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 12 Änderungen der AGB</h2>
              <p>
                Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, wenn dies wegen
                geänderter Gesetze oder Rechtsprechung, wegen neuer oder geänderter Funktionen oder
                zur Beseitigung von Unklarheiten nötig ist. Preise und der Umfang der
                Premium-Leistungen nach § 2 werden auf diesem Weg nicht geändert.
              </p>
              <p>
                Der Anbieter teilt Ihnen die Änderungen mindestens sechs Wochen vor dem geplanten
                Inkrafttreten per E-Mail mit. Widersprechen Sie nicht bis zum Inkrafttreten, gelten
                die geänderten AGB als angenommen. Bis zum Inkrafttreten können Sie ein Abonnement
                außerdem kostenfrei kündigen. Auf diese Folgen weist der Anbieter in der Mitteilung
                gesondert hin. Widersprechen Sie, gelten die bisherigen AGB weiter.
              </p>
            </section>

            {/* 13. Schlussbestimmungen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 13 Schlussbestimmungen</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                Zwingende Verbraucherschutzvorschriften des Staates, in dem Sie Ihren gewöhnlichen
                Aufenthalt haben, bleiben unberührt.
              </p>
              <p>
                Sind Sie Kaufmann, juristische Person des öffentlichen Rechts oder
                öffentlich-rechtliches Sondervermögen, ist Gerichtsstand für alle Streitigkeiten aus
                diesem Vertrag Hamburg.
              </p>
              <p>
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt der
                Vertrag im Übrigen wirksam. An die Stelle der unwirksamen Bestimmung treten die
                gesetzlichen Vorschriften (§ 306 BGB).
              </p>
              <p>Stand: November 2026</p>
            </section>

            {/* Verbraucherstreitbeilegung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Hinweis zur Verbraucherstreitbeilegung</h2>
              <p>
                Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an
                Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AGB;
