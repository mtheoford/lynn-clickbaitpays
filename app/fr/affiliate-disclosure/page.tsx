import FrenchLegalPage, { frenchLegalMetadata, FrenchSupportContact } from "../legal-page";

export const metadata = frenchLegalMetadata({
  path: "affiliate-disclosure",
  englishPath: "/affiliate-disclosure",
  title: "Divulgation d’affiliation",
  description: "Informations sur le caractère indépendant des pages de parrain et leur rémunération potentielle.",
});

export default function FrenchAffiliateDisclosurePage() {
  return (
    <FrenchLegalPage
      eyebrow="Divulgation de la relation"
      title="Divulgation d’affiliation"
      summary="Les sites CBP personnels sont des pages de parrains indépendantes et peuvent contenir des liens de parrainage donnant lieu à une rémunération."
    >
      <h2>Site indépendant</h2>
      <p>ProNeurs™ et chaque page de parrain personnelle sont indépendants de ClickBaitPays. Toute référence à ClickBaitPays ne signifie pas que ClickBaitPays possède, exploite, approuve ou contrôle le site.</p>

      <h2>Rémunération de parrainage</h2>
      <p>Si un visiteur suit le lien de parrainage d’un parrain et participe ensuite au programme, le parrain peut recevoir une rémunération conformément aux règles de parrainage alors en vigueur du tiers. Cette possibilité n’augmente pas le prix de l’abonnement au site ProNeurs™ et ne garantit aucun résultat au visiteur ou au parrain.</p>

      <h2>Risques et résultats</h2>
      <p>La participation à un service tiers peut impliquer des cryptomonnaies, des frais, des pertes, des changements de règles et des risques opérationnels. Les revenus et les retraits ne sont pas garantis. Consultez les conditions officielles en vigueur et effectuez vos propres vérifications avant d’agir.</p>

      <h2>Questions</h2>
      <p>Pour toute question concernant cette divulgation, écrivez à <FrenchSupportContact />.</p>
    </FrenchLegalPage>
  );
}
