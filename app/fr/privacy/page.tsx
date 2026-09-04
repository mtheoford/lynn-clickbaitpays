import FrenchLegalPage, { frenchLegalMetadata, FrenchSupportContact } from "../legal-page";

export const metadata = frenchLegalMetadata({
  path: "privacy",
  englishPath: "/privacy",
  title: "Politique de confidentialité",
  description: "Informations sur les données utilisées pour fournir et protéger les sites CBP personnels.",
});

export default function FrenchPrivacyPage() {
  return (
    <FrenchLegalPage
      eyebrow="Pratiques relatives aux données"
      title="Politique de confidentialité"
      summary="Cette politique explique quelles informations ProNeurs™ utilise afin de fournir et de protéger les sites CBP personnels."
    >
      <h2>Informations collectées</h2>
      <p>Nous recueillons le nom, l’adresse e-mail, le numéro de téléphone, l’adresse de site demandée, la présentation du parrain, les choix de visibilité des coordonnées et l’URL de parrainage fournis lors de l’inscription ou de la modification du compte. Nous conservons également les identifiants Stripe du client et de l’abonnement, le statut de l’abonnement, les journaux de sécurité et d’audit ainsi que des événements de consultation de pages et de clics sortants limités dans le respect de la vie privée. Un identifiant aléatoire propre au site est créé dans le navigateur, puis haché avant d’être conservé; il sert uniquement à estimer le nombre de visiteurs uniques. Les données analytiques ne conservent pas les adresses IP.</p>

      <h2>Informations non collectées</h2>
      <p>Nous ne demandons ni ne conservons les mots de passe ClickBaitPays, les clés de portefeuilles de cryptomonnaies, les soldes de portefeuilles, les numéros complets de cartes bancaires ou les demandes de crédit.</p>

      <h2>Utilisation des informations</h2>
      <p>Les informations sont utilisées pour créer et exploiter le site demandé, authentifier les clients, traiter les abonnements, prévenir les abus, fournir une assistance, mesurer l’activité de base du site, tenir des journaux d’audit et respecter les obligations légales.</p>

      <h2>Informations publiques</h2>
      <p>Votre nom d’affichage, votre présentation de parrain, votre URL de parrainage et les coordonnées que vous choisissez d’afficher sont publiés sur votre page de parrain. Vous pouvez modifier vos choix de visibilité depuis votre compte client.</p>

      <h2>Prestataires de services</h2>
      <p>Cloudflare fournit l’hébergement, la sécurité et l’infrastructure de données. Stripe traite la facturation. Le prestataire de messagerie transactionnelle configuré assure l’envoi des messages relatifs au compte. Ces prestataires traitent les informations conformément à leurs propres contrats et politiques de confidentialité.</p>

      <h2>Conservation et sécurité</h2>
      <p>Nous conservons les informations du compte tant que le service est actif. Lorsqu’une demande de suppression admissible est programmée, le site demeure indisponible pendant un délai de récupération de 30 jours, puis il est définitivement supprimé par un processus automatisé. Stripe peut conserver des documents financiers et ProNeurs™ peut conserver certaines informations d’audit non personnelles lorsque cela est nécessaire pour la comptabilité, les litiges, la prévention de la fraude ou le respect d’obligations légales. L’accès est restreint, les secrets sont conservés hors du code source et les liens sensibles sont de courte durée et à usage unique.</p>

      <h2>Vos choix</h2>
      <p>Vous pouvez mettre à jour vos informations publiques et vos choix de visibilité, gérer ou résilier la facturation au moyen de Stripe, ou demander l’accès à vos renseignements personnels admissibles, leur rectification ou leur suppression en écrivant à <FrenchSupportContact />. La résiliation de l’abonnement et la suppression des données sont deux actions distinctes.</p>
    </FrenchLegalPage>
  );
}
