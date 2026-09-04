import Link from "next/link";

import FrenchLegalPage, { frenchLegalMetadata } from "../legal-page";

const officialFaqUrl = "https://clickbaitpays.me/questions.php";

export const metadata = frenchLegalMetadata({
  path: "faq",
  englishPath: officialFaqUrl,
  title: "FAQ ClickBaitPays en français",
  description: "Traduction française des 15 questions fréquentes officielles de ClickBaitPays.",
});

export default function FrenchFaqPage() {
  return (
    <FrenchLegalPage
      eyebrow="Guide pratique"
      title="Questions fréquentes"
      summary="Une traduction française des 15 questions et réponses publiées par ClickBaitPays pour vous aider à utiliser la plateforme."
      updatedLabel="Source officielle consultée le 4 septembre 2026"
    >
      <p>
        <strong>Source et mises à jour:</strong> cette page est une traduction pratique de la{" "}
        <a href={officialFaqUrl} target="_blank" rel="noreferrer">
          FAQ officielle de ClickBaitPays en anglais
        </a>.
        Les fonctionnalités, délais et règles peuvent changer. Consultez toujours la source officielle et les informations affichées dans votre compte avant d’agir.
      </p>

      <h2>1. Qu’est-ce que ClickBaitPays?</h2>
      <p>ClickBaitPays est une plateforme publicitaire de type « rémunération au clic » (paid-to-click, ou PTC). Les annonceurs achètent des campagnes publicitaires afin de présenter leur contenu à de vrais utilisateurs. Les membres gagnent de la cryptomonnaie en consultant ces publicités chaque jour. Les annonceurs obtiennent du trafic, les visiteurs sont rémunérés et chacun y trouve son compte.</p>

      <h2>2. Comment commencer?</h2>
      <ol>
        <li>Obtenez le lien de parrainage de votre parrain et créez un compte gratuit. Vous devez vous inscrire depuis l’adresse IP de votre domicile: n’utilisez ni VPN ni données mobiles pendant l’inscription.</li>
        <li>Connectez-vous, lisez la page « How It Works » et le <Link href="/docs/guide-demarrage-clickbaitpays-fr.pdf">Guide de démarrage en français</Link>, puis choisissez le niveau de campagne publicitaire qui vous convient.</li>
        <li>Approvisionnez votre compte en cryptomonnaie depuis la page « Deposit ».</li>
        <li>Ouvrez « Buy Ad Campaigns », choisissez votre niveau et confirmez l’achat.</li>
        <li>Payez les frais d’activation uniques de ce niveau afin d’activer vos gains.</li>
        <li>Ouvrez « Click Ads » dans le menu de gauche et commencez à cliquer sur vos publicités quotidiennes.</li>
        <li>Après la fin de votre campagne de 12 jours et le délai de retenue de 7 jours, vos gains sont transférés vers votre solde disponible (« Available Balance »). Vous pouvez alors les retirer, les transférer à un autre membre avec « Pay It Forward » ou acheter une nouvelle campagne.</li>
      </ol>

      <h2>3. Combien de temps faut-il attendre avant de commencer à gagner?</h2>
      <p>Dès que vous avez acheté un niveau de campagne publicitaire et payé les frais d’activation uniques correspondants, vous pouvez commencer immédiatement à cliquer sur les publicités et à gagner.</p>

      <h2>4. Comment payer en cryptomonnaie?</h2>
      <p>Pour approvisionner votre compte:</p>
      <ol>
        <li>Depuis votre tableau de bord, ouvrez « Deposit » dans le menu de gauche et saisissez le montant en USDT que vous souhaitez déposer.</li>
        <li>Cliquez sur « Deposit Funds ». Vous êtes redirigé vers NOWPayments pour effectuer le paiement.</li>
        <li>Choisissez votre cryptomonnaie dans la liste « Choose asset ». NOWPayments accepte notamment Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Tron (TRX), Ripple (XRP) et des centaines d’autres cryptomonnaies.</li>
        <li>NOWPayments affiche le montant exact à envoyer et une adresse de portefeuille unique. Notez votre identifiant de paiement à 10 chiffres: vous en aurez besoin pour contacter l’assistance au sujet du dépôt.</li>
        <li>Copiez directement l’adresse du portefeuille et envoyez exactement le montant indiqué. Ne saisissez pas l’adresse manuellement.</li>
        <li>Attendez la confirmation du dépôt. Selon la cryptomonnaie et l’encombrement du réseau, cela peut prendre de quelques minutes à quelques heures.</li>
        <li>Une fois le dépôt crédité, ouvrez « Buy Ad Campaigns », choisissez votre niveau et terminez l’achat.</li>
        <li>Vous serez ensuite invité à payer les frais d’activation uniques de ce niveau. Ce paiement est obligatoire pour activer vos gains et doit être effectué avant de pouvoir commencer à gagner.</li>
      </ol>
      <p><strong>Important:</strong> NOWPayments génère une adresse de portefeuille unique pour chaque dépôt. Ne réutilisez jamais l’adresse d’un dépôt précédent: vous risqueriez de perdre les fonds.</p>

      <h2>5. Que faire si mon paiement n’apparaît pas?</h2>
      <p>Prévoyez jusqu’à 12 heures pour la confirmation du dépôt, car le délai de traitement varie selon la cryptomonnaie.</p>
      <p>Si le dépôt n’est toujours pas crédité après 12 heures, vérifiez les points suivants:</p>
      <ul>
        <li>Avez-vous envoyé le montant exact affiché sur la page de paiement?</li>
        <li>Avez-vous envoyé la bonne cryptomonnaie?</li>
        <li>Avez-vous utilisé l’adresse générée pour ce dépôt précis? Chaque dépôt possède une adresse unique; n’utilisez pas celle d’une transaction antérieure.</li>
      </ul>
      <p>Si tout semble correct mais que le dépôt est toujours absent, contactez l’assistance depuis la page « Contact Us » en indiquant votre nom d’utilisateur, l’identifiant de paiement à 10 chiffres, le hachage de la transaction et le montant envoyé.</p>

      <h2>6. Pourquoi faut-il publier une publicité?</h2>
      <p>Les publicités permettent à la plateforme de fonctionner. En publiant des annonces, vous contribuez à créer des possibilités de gains pour vous-même et pour les autres membres.</p>

      <h2>7. Quel site web puis-je promouvoir?</h2>
      <p>Vous pouvez promouvoir presque n’importe quel site web, notamment votre lien de parrainage d’un autre programme, l’association caritative de votre choix ou un produit affilié proposé sur une plateforme telle que ClickBank. Les contenus illégaux, dangereux ou contraires aux conditions d’utilisation sont interdits. Les grands sites web connus, comme Google ou Facebook, ne peuvent pas être utilisés.</p>

      <h2>8. Ai-je besoin de filleuls?</h2>
      <p>Non. Les filleuls ne sont pas obligatoires. Vous gagnez en cliquant sur les publicités de votre propre campagne. Les filleuls permettent simplement de gagner davantage.</p>

      <h2>9. Comment fonctionnent les gains de parrainage?</h2>
      <p>Vous recevez une commission de 10 % sur chaque clic effectué par votre filleul. Elle est immédiatement créditée sur votre solde disponible.</p>

      <h2>10. Comment suis-je rémunéré pour chaque clic?</h2>
      <p>Chaque niveau de campagne publicitaire possède un coût par clic (CPC) défini. Lorsque vous cliquez sur une publicité et la consultez pendant la durée requise, vous gagnez 90 % de ce CPC. Le montant varie selon le niveau.</p>

      <h2>11. Que se passe-t-il à la fin de ma campagne publicitaire de 12 jours?</h2>
      <p>Après les 12 jours de campagne, vos gains sont placés en retenue pendant 7 jours avant d’être transférés vers votre solde disponible. Vous pouvez ensuite utiliser ces fonds pour acheter une nouvelle campagne, les transférer à un autre membre avec « Pay It Forward » ou demander un retrait. Des frais de 10 % s’appliquent à tous les retraits.</p>

      <h2>12. Comment serai-je payé?</h2>
      <p>Lorsque vos gains sont disponibles dans « Available Balance », vous pouvez demander un retrait directement vers votre portefeuille de cryptomonnaies. Une demande de retrait peut être effectuée une fois par semaine. Elle est traitée manuellement par l’équipe d’administration dans les 48 heures suivant son envoi.</p>

      <h2>13. Que faut-il pour effectuer un retrait?</h2>
      <p>Vous devez disposer d’un solde minimum de 10 USDT et d’une adresse de portefeuille valide pour la cryptomonnaie choisie. Des frais de retrait de 10 % s’appliquent à tous les retraits.</p>

      <h2>14. Les paiements sont-ils instantanés?</h2>
      <p>Non. Les retraits sont traités manuellement par l’équipe d’administration et exécutés dans les 48 heures suivant la demande. Une fois le retrait traité, la cryptomonnaie est envoyée directement à l’adresse de portefeuille que vous avez indiquée.</p>

      <h2>15. Puis-je créer plusieurs comptes?</h2>
      <p>Chaque personne ne peut posséder qu’un seul compte.</p>
      <p>Au maximum 3 comptes sont autorisés par foyer. Chacun doit appartenir à un membre adulte différent du foyer et utiliser sa propre adresse e-mail. Tous les comptes du foyer doivent être enregistrés sous le même parrain initial; les membres d’un même foyer ne peuvent pas se parrainer entre eux. Si plus de 3 comptes sont détectés sur une même adresse IP, tous les comptes associés peuvent être suspendus.</p>
      <p><strong>Avertissement relatif à la perte du compte:</strong> l’utilisation de serveurs mandataires (proxies), robots, cliqueurs automatiques, scripts, émulateurs, systèmes de manipulation du trafic ou de toute méthode conçue pour masquer votre identité ou automatiser une activité est strictement interdite.</p>
      <p>Tout compte détecté utilisant ces méthodes sera immédiatement et définitivement supprimé, ainsi que l’ensemble des comptes, soldes et gains associés.</p>
      <p><strong>Aucun avertissement. Aucun recours. Aucune exception.</strong></p>

      <p>Pour consulter les mises à jour ou obtenir une aide supplémentaire, rendez-vous sur la <a href={officialFaqUrl} target="_blank" rel="noreferrer">FAQ officielle en anglais</a>.</p>
    </FrenchLegalPage>
  );
}
