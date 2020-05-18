function parseInput(msg) {
  const split = msg.split(" "); //Split des arguments

  let parsed_tab = [];

  let num;

  for (let i = 0; i < split.length; i++) {
    num = parseInt(split[i], 10);

    if (num > 0) parsed_tab.push(num);
  }

  return parsed_tab;
}

function getLosses(moonsize, nbrip, nb_attaquant) {
  //Estimation des pertes

  // 100 RIP 3 j = 18 vagues (3*6)
  // 15 RIP 3 j = 15 vagues
  //donc si nbrip >= nb_att * 6 => nb_vague = nb_att*6
  //sinon nbvague = nbrip

  let nb_vague;

  if (nbrip >= nb_attaquant * 6) nb_vague = nb_attaquant * 6;
  else nb_vague = nbrip;

  //proba d'echec d'une vague moyenne de rip
  const proba_moyenne = (100 - Math.sqrt(moonsize)) *
    Math.sqrt(nbrip / nb_vague) / 100;
  const proba_echec_moy = 1 - proba_moyenne;

  //proba de destruction d'une vague de rip moyenne
  const proba_destr = Math.sqrt(moonsize) / 200;

  //somme des pertes
  let pertes = 0;
  let variance = 0;

  //les pertes sont calculé itérativement: nbrip_moy * proba_destr * proba que les vagues d'avant échouent
  for (let i = 0; i < nb_vague; i++) {
    pertes = pertes + (nbrip / nb_vague) * proba_destr *
      (proba_echec_moy ** (i));

    //On considère 6 variables de bernoulli Xk de proba proba_destr*proba_echec_moy^(k-1)
    //Ces 6 lois sont indépendantes (calcul de covariance Cov(Xi,Xj)=0 pour tout i!=j)
    //donc la variance de la somme est la somme des variances
    //Enfin, les pertes variances sont les pertes associés à chaque loi est la variance de la loi Xk * le nb de rip de la vague k
    variance = variance + (nbrip / nb_vague) * proba_destr *
      (proba_echec_moy ** (i)) * (1 - proba_destr * (proba_echec_moy ** (i)));
  }

  let ecarttype = Math.sqrt(variance);

  //On modélisera la répartition des pertes par une gaussienne.
  let min1 = Math.round(100 * Math.max((pertes - ecarttype), 0)) / 100;
  let min2 = Math.round(100 * Math.max((pertes - 2 * ecarttype), 0)) / 100;
  let min3 = Math.round(100 * Math.max((pertes - 3 * ecarttype), 0)) / 100;
  let max1 = Math.round(100 * Math.min((pertes + ecarttype), nbrip)) / 100;
  let max2 = Math.round(100 * Math.min((pertes + 2 * ecarttype), nbrip)) / 100;
  let max3 = Math.round(100 * Math.min((pertes + 3 * ecarttype), nbrip)) / 100;

  //arrondi des pertes au centiemes
  pertes = Math.round(100 * pertes) / 100;

  return { pertes, min1, max1, min2, max2, min3, max3 };
}

function moonBreak(message) {
  const msg = message.substring(4);
  const tab = parseInput(msg);
  const moonsize = tab[0];
  const nb_joueur = tab.length - 1;

  let check_rip = false;

  if (nb_joueur > 0) { //il faut au moins un attaquant
    for (var i = 1; i <= nb_joueur; i++) {
      if (tab[i] < 0) check_rip = true; //On vérifie que tout les nombres rentrés sont positifs
    }
  } else {
    check_rip = true; //sinon erreur
  }

  // Valiadation des conditions
  if (moonsize < 3464 || moonsize > 8944 || check_rip) {
    return "Erreur dans les paramètres.\n    Usage: !mb <TailleLune> <Nombre_RIP_J1> [<Nombre_RIP_J2>] [<Nombre_RIP_J3>] ... [<Nombre_RIP_JN>]\n\nTaille de la lune compris entre 3464km et 8944km.\nNombre_RIP un nombre entier positif.\nEntre 1 et 4 attaquant(s) au plus.";
  }

  let vague_joueur = [];
  let reste_joueur = [];

  let proba_mb = 1;
  let proba_echec = 1;
  let proba_full_echec = 1; //proba initiale que x mb echouent

  for (var j = 1; j <= nb_joueur; j++) {
    let nbrip = tab[j];

    let nbrip_vague = Math.floor(nbrip / 6); //Nb de rip par vague
    let nbrip_reste = nbrip % 6; //Reste à ajouter aux vagues
    vague_joueur[j - 1] = nbrip_vague;
    reste_joueur[j - 1] = nbrip_reste;

    if (nbrip_reste === 0) { //S'il n'y a pas de reste, on calcul la proba des 6vagues consécutives de y RIPs
      //Proba pourcent de moonbreak (formule officielle)
      proba_mb = ((100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague)) / 100;
      if (proba_mb > 1) proba_mb = 1; //Caution si la proba est > 1

      proba_echec = 1 - proba_mb; //proba d'echec

      proba_full_echec = proba_full_echec * (proba_echec ** 6); //proba d'echec des 6 vagues consécutives
    } else { //S'il y a des restes on calcul d'abord la proba d'échec des r vagues de nbrip_vague+1 RIP puis les 6-r autres vagues de nbrip_vague
      //proba pourcent de mb (formule officielle) pour une vague de nbrip_vague+1
      proba_mb = ((100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague + 1)) /
        100;
      if (proba_mb > 1) proba_mb = 1; //Caution si la proba est > 1

      proba_echec = 1 - proba_mb; //proba d'échec

      proba_full_echec = proba_full_echec * (proba_echec ** nbrip_reste); //proba d'échec des r vagues de y+1 RIP consécutives

      //proba pourcent de mb (formule officielle) pour une vague de nbrip_vague
      proba_mb = (100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague) / 100;
      if (proba_mb > 1) proba_mb = 1; //Caution si la proba est > 1

      proba_echec = 1 - proba_mb; //proba d'échec

      proba_full_echec = proba_full_echec * (proba_echec ** (6 - nbrip_reste)); //proba d'echec des r vagues de y+1 RIP et 6-r vagues consécutives de y RIPs
    }
  }

  const proba_reussite = Math.round((1 - proba_full_echec) * 10000) / 100; //calcul de la proba de ne pas echouer tout arrondi au centième

  let mbspeak = "";

  if (nb_joueur == 1) {
    mbspeak = "__**" + proba_reussite + "% de réussite du MoonBreak**__ (" +
      moonsize + "km) avec ";
  } else {
    mbspeak = "__**" + proba_reussite + "% de réussite du MoonBreak**__ (" +
      moonsize + "km) par " + nb_joueur + " attaquants :\n\n";
  }

  for (var j = 1; j <= nb_joueur; j++) {
    let nbrip = tab[j];
    let nbrip_vague = vague_joueur[j - 1];
    let nbrip_reste = reste_joueur[j - 1];

    if (nb_joueur > 1) {
      mbspeak += "-> Attaquant #" + j + " *(" + nbrip + " RIP)* : ";
    }

    if (nbrip >= 6) { //préparation du msg de retour
      switch (nbrip_reste) {
        case 0:
          mbspeak = mbspeak + "***6 vagues de " + nbrip_vague + " RIP.***\n";
          break;
        case 1:
          mbspeak = mbspeak + "***1 vague de " + (nbrip_vague + 1) +
            " et 5 vagues de " + nbrip_vague + " RIP.***\n";
          break;
        case 5:
          mbspeak = mbspeak + "***5 vagues de " + (nbrip_vague + 1) +
            " et 1 vague de " + nbrip_vague + " RIP.***\n";
          break;
        default:
          mbspeak = mbspeak + "***" + nbrip_reste + " vagues de " +
            (nbrip_vague + 1) + " et " + (6 - nbrip_reste) + " vagues de " +
            nbrip_vague + " RIP.***\n";
      }
    } else {
      if (nbrip_reste === 1) {
        mbspeak = mbspeak + "***1 vague de " + (nbrip_vague + 1) + " RIP.***\n";
      } else {
        mbspeak = mbspeak + "***" + nbrip_reste + " vagues de " +
          (nbrip_vague + 1) + " RIP.***\n";
      }
    }
  }

  let total_rip = 0;

  for (var i = 1; i <= nb_joueur; i++) {
    total_rip += tab[i];
  }

  const { pertes, min1, max1, min2, max2, min3, max3 } = getLosses(
    moonsize,
    total_rip,
    nb_joueur,
  );

  //On utilise alors les propriétés de répartitions autour d'une gaussienne avec l'écart type
  mbspeak = mbspeak + "\n**Estimation des pertes totales:**";
  mbspeak = mbspeak + "\n        • *68% de chance de perdre entre* " + min1 +
    " *et* " + max1 + " *RIP. (faible estimation)*";
  mbspeak = mbspeak + "\n        • *95% de chance de perdre entre* " + min2 +
    " *et* " + max2 + " *RIP. (meilleur compromis)*";
  mbspeak = mbspeak + "\n        • *99% de chance de perdre entre* " + min3 +
    " *et* " + max3 + " *RIP. (très forte estimation)*";
  mbspeak = mbspeak + "\n        ***Pertes moyennes: " + pertes +
    " RIP détruite(s) sur " + total_rip + "***\n\n";

  return mbspeak;
}

module.exports = {
  moonBreak,
};
