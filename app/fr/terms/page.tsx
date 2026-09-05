import FrenchLegalPage, { frenchLegalMetadata, FrenchSupportContact } from "../legal-page";

export const metadata = frenchLegalMetadata({
  path: "terms",
  title: "Conditions d’abonnement",
  description: "Conditions applicables au service indépendant de sites CBP personnels de ProNeurs.",
});

export default function FrenchTermsPage() {
  return (
    <FrenchLegalPage
      eyebrow="Contrat de service"
      title="Conditions d’abonnement"
      summary="Les présentes conditions régissent le service de site web indépendant commercialisé par ProNeurs™. Elles ne régissent ni l’adhésion à ClickBaitPays ni la participation à ce programme."
    >
      <h2>1. Le service</h2>
      <p>ProNeurs™ fournit une page d’information et de parrainage personnalisée et hébergée, des outils de gestion de compte ainsi qu’un contenu de site web géré de manière centralisée. ProNeurs™ est indépendant de ClickBaitPays et ne contrôle pas les comptes, campagnes, paiements, retraits, règles, disponibilités ou résultats de ClickBaitPays.</p>

      <h2>2. Admissibilité et informations du compte</h2>
      <p>Vous devez fournir des coordonnées exactes ainsi qu’une URL de parrainage officielle que vous êtes autorisé à utiliser. Il vous appartient de tenir ces informations à jour et de protéger l’accès à votre compte de messagerie et à vos liens de gestion.</p>

      <h2>3. Abonnement et renouvellement</h2>
      <p>Le service est facturé mensuellement ou annuellement par Stripe et se renouvelle automatiquement jusqu’à sa résiliation. Les tarifs en vigueur sont affichés avant le paiement. Des taxes peuvent s’appliquer. Stripe conserve et traite les informations de carte bancaire; ProNeurs™ ne conserve pas les numéros de carte complets.</p>

      <h2>4. Résiliation</h2>
      <p>Vous pouvez résilier votre abonnement depuis le portail client Stripe. Sauf disposition légale contraire, le site demeure accessible jusqu’à la fin de la période d’abonnement payée, puis il est dépublié. La résiliation ne supprime pas automatiquement les données du compte. Les demandes de suppression admissibles bénéficient normalement d’un délai de récupération de 30 jours avant la suppression définitive. En cas d’échec de paiement, une période de régularisation de sept jours peut être accordée avant la suspension.</p>

      <h2>5. Absence de promesse de performance</h2>
      <p>Le service ne garantit aucun trafic, prospect, parrainage, acceptation dans un programme tiers, résultat financier ou revenu. Les cryptomonnaies et la participation à des programmes tiers comportent des risques importants.</p>

      <h2>6. Contenu et utilisation acceptable</h2>
      <p>Vous ne pouvez pas utiliser le service pour diffuser des affirmations trompeuses, usurper une identité, mener une promotion illégale, envoyer des messages indésirables, distribuer des logiciels malveillants, effectuer des redirections dangereuses ou exploiter sans autorisation la propriété intellectuelle d’autrui. ProNeurs™ peut corriger, suspendre ou supprimer tout contenu ou site qui enfreint les présentes conditions ou la Politique d’utilisation acceptable.</p>

      <h2>7. Services tiers</h2>
      <p>Le site peut contenir des liens vers ClickBaitPays, Stripe et d’autres services indépendants. Leurs conditions, politiques, disponibilités et pratiques relèvent de leur propre responsabilité.</p>

      <h2>8. Disponibilité et modifications</h2>
      <p>ProNeurs™ peut mettre à jour le contenu géré de manière centralisée, les informations obligatoires, les mesures de sécurité et les fonctionnalités du service. Des opérations de maintenance raisonnables et des événements indépendants de la volonté de ProNeurs™ peuvent temporairement affecter la disponibilité du service.</p>

      <h2>9. Nous contacter</h2>
      <p>Pour toute question concernant les présentes conditions, écrivez à <FrenchSupportContact />.</p>
    </FrenchLegalPage>
  );
}
