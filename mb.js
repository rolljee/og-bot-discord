function parseInput(msg) {
  const split = msg.split(' '); //Split des arguments

  let parsed_tab = [];

  let num;

  for (let i = 0; i < split.length; i++) {
    num = parseInt(split[i], 10);

    if (num > 0) {
      parsed_tab.push(num);
    }
  }

  return parsed_tab;
}

// Les vagues qu'un attaquant envoie réellement, dans l'ordre où elles partent:
// `reste` vagues d'un RIP de plus, puis les autres. Un attaquant qui a moins de
// 6 RIP envoie des vagues vides, qui ne menacent pas la lune et ne perdent
// aucun vaisseau.
function vaguesAttaquant(nbrip) {
  const base = Math.floor(nbrip / 6);
  const reste = nbrip % 6;

  return Array.from({ length: 6 }, (_, i) => (i < reste ? base + 1 : base));
}

// Toutes les vagues de l'attaque, dans l'ordre de tir. Les attaquants passent
// l'un après l'autre: dès qu'une vague réussit, la lune n'est plus là et rien
// derrière ne tire.
export function vaguesAttaque(flottes) {
  return flottes.flatMap(vaguesAttaquant);
}

// Estimation des pertes, parcourue sur les vagues réelles de l'attaque —
// celles-là mêmes qui servent au calcul de la probabilité, chacune à sa taille.
// Auparavant la flotte était mise en commun en une seule taille de vague
// moyenne (`nbrip / nb_vague`), ce qui rendait l'estimation aveugle au partage:
// 101 RIP envoyées en 1 + 100 donnaient les mêmes pertes qu'en 50 + 50, alors
// que la probabilité de casser la lune passe de 79 % à 87 %.
//
// Chaque RIP d'une vague est détruite indépendamment avec la probabilité
// `proba_destr`, donc une vague perd Binomiale(taille, proba_destr) vaisseaux.
// La variance ci-dessous somme les variances par vague, ce qui les suppose
// indépendantes alors qu'elles partagent la chaîne de survie; la dispersion est
// ensuite résumée par une gaussienne. Deux approximations conservées du modèle
// d'origine.
function getLosses(moonsize, flottes) {
  const nbrip = flottes.reduce((total, rip) => total + rip, 0);

  //proba de destruction d'une RIP par la lune
  const proba_destr = Math.sqrt(moonsize) / 200;

  //somme des pertes
  let pertes = 0;
  let variance = 0;

  //proba que toutes les vagues précédentes aient échoué: une vague ne coûte des
  //RIP que si elle part.
  let atteinte = 1;

  for (const taille of vaguesAttaque(flottes)) {
    const p = proba_destr * atteinte;

    pertes = pertes + taille * p;
    variance = variance + taille * p * (1 - p);

    //proba de réussite d'une vague de cette taille, plafonnée à 1 comme dans la
    //formule officielle
    const proba_vague = Math.min(
      ((100 - Math.sqrt(moonsize)) * Math.sqrt(taille)) / 100,
      1,
    );

    atteinte = atteinte * (1 - proba_vague);
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

export function moonBreak(message) {
  const msg = message.substring(4);
  const tab = parseInput(msg);
  const moonsize = tab[0];
  const nb_joueur = tab.length - 1;

  let check_rip = false;

  if (nb_joueur > 0) { //il faut au moins un attaquant
    for (let i = 1; i <= nb_joueur; i++) {
      if (tab[i] < 0) {
        check_rip = true; //On vérifie que tout les nombres rentrés sont positifs
      }
    }
  } else {
    check_rip = true; //sinon erreur
  }

  // Valiadation des conditions
  if (moonsize < 3464 || moonsize > 8944 || check_rip) {
    return 'Erreur dans les paramètres.\n    Usage: !mb <TailleLune> <Nombre_RIP_J1> [<Nombre_RIP_J2>] [<Nombre_RIP_J3>] ... [<Nombre_RIP_JN>]\n\nTaille de la lune compris entre 3464km et 8944km.\nNombre_RIP un nombre entier positif.\nEntre 1 et 4 attaquant(s) au plus.';
  }

  let vague_joueur = [];
  let reste_joueur = [];

  let proba_mb;
  let proba_echec;
  let proba_full_echec = 1; //proba initiale que x mb echouent

  for (let j = 1; j <= nb_joueur; j++) {
    let nbrip = tab[j];

    let nbrip_vague = Math.floor(nbrip / 6); //Nb de rip par vague
    let nbrip_reste = nbrip % 6; //Reste à ajouter aux vagues
    vague_joueur[j - 1] = nbrip_vague;
    reste_joueur[j - 1] = nbrip_reste;

    if (nbrip_reste === 0) { //S'il n'y a pas de reste, on calcul la proba des 6vagues consécutives de y RIPs
      //Proba pourcent de moonbreak (formule officielle)
      proba_mb = ((100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague)) / 100;
      if (proba_mb > 1) {
        proba_mb = 1; //Caution si la proba est > 1
      }

      proba_echec = 1 - proba_mb; //proba d'echec

      proba_full_echec = proba_full_echec * (proba_echec ** 6); //proba d'echec des 6 vagues consécutives
    } else { //S'il y a des restes on calcul d'abord la proba d'échec des r vagues de nbrip_vague+1 RIP puis les 6-r autres vagues de nbrip_vague
      //proba pourcent de mb (formule officielle) pour une vague de nbrip_vague+1
      proba_mb = ((100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague + 1)) /
        100;
      if (proba_mb > 1) {
        proba_mb = 1; //Caution si la proba est > 1
      }

      proba_echec = 1 - proba_mb; //proba d'échec

      proba_full_echec = proba_full_echec * (proba_echec ** nbrip_reste); //proba d'échec des r vagues de y+1 RIP consécutives

      //proba pourcent de mb (formule officielle) pour une vague de nbrip_vague
      proba_mb = (100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague) / 100;
      if (proba_mb > 1) {
        proba_mb = 1; //Caution si la proba est > 1
      }

      proba_echec = 1 - proba_mb; //proba d'échec

      proba_full_echec = proba_full_echec * (proba_echec ** (6 - nbrip_reste)); //proba d'echec des r vagues de y+1 RIP et 6-r vagues consécutives de y RIPs
    }
  }

  const proba_reussite = Math.round((1 - proba_full_echec) * 10000) / 100; //calcul de la proba de ne pas echouer tout arrondi au centième

  let mbspeak;

  if (nb_joueur === 1) {
    mbspeak = '__**' + proba_reussite + '% de réussite du MoonBreak**__ (' +
      moonsize + 'km) avec ';
  } else {
    mbspeak = '__**' + proba_reussite + '% de réussite du MoonBreak**__ (' +
      moonsize + 'km) par ' + nb_joueur + ' attaquants :\n\n';
  }

  for (let j = 1; j <= nb_joueur; j++) {
    let nbrip = tab[j];
    let nbrip_vague = vague_joueur[j - 1];
    let nbrip_reste = reste_joueur[j - 1];

    if (nb_joueur > 1) {
      mbspeak += '-> Attaquant #' + j + ' *(' + nbrip + ' RIP)* : ';
    }

    if (nbrip >= 6) { //préparation du msg de retour
      switch (nbrip_reste) {
        case 0:
          mbspeak = mbspeak + '***6 vagues de ' + nbrip_vague + ' RIP.***\n';
          break;
        case 1:
          mbspeak = mbspeak + '***1 vague de ' + (nbrip_vague + 1) +
            ' et 5 vagues de ' + nbrip_vague + ' RIP.***\n';
          break;
        case 5:
          mbspeak = mbspeak + '***5 vagues de ' + (nbrip_vague + 1) +
            ' et 1 vague de ' + nbrip_vague + ' RIP.***\n';
          break;
        default:
          mbspeak = mbspeak + '***' + nbrip_reste + ' vagues de ' +
            (nbrip_vague + 1) + ' et ' + (6 - nbrip_reste) + ' vagues de ' +
            nbrip_vague + ' RIP.***\n';
      }
    } else if (nbrip_reste === 1) {
      mbspeak = mbspeak + '***1 vague de ' + (nbrip_vague + 1) + ' RIP.***\n';
    } else {
      mbspeak = mbspeak + '***' + nbrip_reste + ' vagues de ' +
        (nbrip_vague + 1) + ' RIP.***\n';
    }
  }

  //Les flottes dans l'ordre où elles sont listées, qui est l'ordre de tir.
  const flottes = tab.slice(1, nb_joueur + 1);
  const total_rip = flottes.reduce((total, rip) => total + rip, 0);

  const { pertes, min1, max1, min2, max2, min3, max3 } = getLosses(
    moonsize,
    flottes,
  );

  //On utilise alors les propriétés de répartitions autour d'une gaussienne avec l'écart type
  mbspeak = mbspeak + '\n**Estimation des pertes totales:**';
  mbspeak = mbspeak + '\n        • *68% de chance de perdre entre* ' + min1 +
    ' *et* ' + max1 + ' *RIP. (faible estimation)*';
  mbspeak = mbspeak + '\n        • *95% de chance de perdre entre* ' + min2 +
    ' *et* ' + max2 + ' *RIP. (meilleur compromis)*';
  mbspeak = mbspeak + '\n        • *99% de chance de perdre entre* ' + min3 +
    ' *et* ' + max3 + ' *RIP. (très forte estimation)*';
  mbspeak = mbspeak + '\n        ***Pertes moyennes: ' + pertes +
    ' RIP détruite(s) sur ' + total_rip + '***\n\n';

  return mbspeak;
}
