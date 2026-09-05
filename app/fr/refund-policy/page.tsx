import FrenchLegalPage, { frenchLegalMetadata, FrenchSupportContact } from "../legal-page";

export const metadata = frenchLegalMetadata({
  path: "refund-policy",
  title: "Politique de résiliation et de remboursement",
  description: "Modalités de résiliation, d’échec de paiement et de remboursement des sites CBP personnels.",
});

export default function FrenchRefundPolicyPage() {
  return (
    <FrenchLegalPage
      eyebrow="Politique de facturation"
      title="Résiliation et remboursements"
      summary="Les abonnements peuvent être résiliés au moyen de Stripe et demeurent normalement actifs jusqu’à la fin de la période payée."
    >
      <h2>Résiliation</h2>
      <p>Les clients peuvent résilier à tout moment depuis le portail de facturation. La résiliation met fin aux renouvellements futurs. Sauf si une date différente est indiquée dans Stripe, le site reste publié jusqu’à la fin de la période payée en cours, puis il est dépublié.</p>

      <h2>Échecs de paiement</h2>
      <p>En cas d’échec d’un renouvellement, ProNeurs™ peut maintenir le site accessible pendant une période de régularisation de sept jours. Si le paiement n’est pas régularisé, le site peut être suspendu jusqu’à la correction de la facturation.</p>

      <h2>Remboursements</h2>
      <p>En règle générale, les frais d’abonnement ne sont pas remboursables une fois la période de service commencée. ProNeurs™ examinera les doubles facturations, les paiements non autorisés, les défaillances importantes du service et les remboursements exigés par la loi applicable. La résiliation n’entraîne pas automatiquement le remboursement de la période en cours.</p>

      <h2>Demander un examen</h2>
      <p>Écrivez à <FrenchSupportContact /> en indiquant l’adresse e-mail du compte, la date du paiement et le motif de la demande. N’envoyez aucun numéro de carte, identifiant de portefeuille ou mot de passe.</p>
    </FrenchLegalPage>
  );
}
