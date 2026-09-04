import FrenchLegalPage, { frenchLegalMetadata, FrenchSupportContact } from "../legal-page";

export const metadata = frenchLegalMetadata({
  path: "acceptable-use",
  englishPath: "/acceptable-use",
  title: "Politique d’utilisation acceptable",
  description: "Règles applicables au contenu et à l’utilisation des sites CBP personnels.",
});

export default function FrenchAcceptableUsePage() {
  return (
    <FrenchLegalPage
      eyebrow="Normes relatives au contenu"
      title="Politique d’utilisation acceptable"
      summary="Les sites CBP personnels doivent être véridiques, licites, sûrs et conformes aux informations gérées de manière centralisée."
    >
      <h2>Utilisation autorisée</h2>
      <p>Le service peut servir à communiquer des informations éducatives approuvées, votre URL de parrainage autorisée, des coordonnées exactes ainsi qu’une présentation factuelle du parrain.</p>

      <h2>Utilisation interdite</h2>
      <ul>
        <li>Les affirmations non étayées et non approuvées présentant des revenus comme garantis, habituels, passifs, quotidiens, destinés à la retraite ou susceptibles de remplacer un salaire.</li>
        <li>Les faux témoignages, les résultats fabriqués, l’usurpation d’identité ou toute présentation trompeuse d’une affiliation.</li>
        <li>Les messages indésirables, les communications adressées à des listes achetées, les abus automatisés, les redirections trompeuses, l’hameçonnage, les logiciels malveillants ou les liens dangereux.</li>
        <li>La collecte de mots de passe, de clés ou de soldes de portefeuilles, de pièces d’identité ou de données de cartes bancaires.</li>
        <li>Les activités illégales, le contournement de sanctions, les atteintes aux droits, le harcèlement ou les contenus discriminatoires.</li>
        <li>La suppression ou la dissimulation des informations centralisées relatives aux risques, à l’affiliation, à la confidentialité ou au caractère indépendant du site.</li>
      </ul>

      <h2>Mise en application</h2>
      <p>ProNeurs™ peut corriger du contenu, désactiver des liens, suspendre un site ou mettre fin au service lorsque cela est raisonnablement nécessaire pour protéger les visiteurs, les prestataires ou l’entreprise. Toute préoccupation urgente peut être signalée à <FrenchSupportContact />.</p>
    </FrenchLegalPage>
  );
}
