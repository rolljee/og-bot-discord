import Ogame from 'ogamejs';

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

// Les vagues, la probabilité et les pertes viennent d'ogamejs
// (`Fleets.getMoonbreak*`), comme sur ogame-ui: le bot et le site partagent le
// même calcul. Ce fichier ne garde que la lecture de la commande et le message.
const { getMoonbreakWaves, getMoonbreakChance, getMoonbreakLosses } = Ogame.Fleets;

const arrondi = (n) => Math.round(n * 100) / 100;

// Toutes les vagues de l'attaque, dans l'ordre de tir: six par attaquant, les
// plus grosses en tête.
export function vaguesAttaque(flottes) {
  return flottes.flatMap(getMoonbreakWaves);
}

function getLosses(moonsize, flottes) {
  const { mean, bands } = getMoonbreakLosses(moonsize, flottes);
  const [b1, b2, b3] = bands;

  return {
    pertes: arrondi(mean),
    min1: arrondi(b1.min), max1: arrondi(b1.max),
    min2: arrondi(b2.min), max2: arrondi(b2.max),
    min3: arrondi(b3.min), max3: arrondi(b3.max),
  };
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

  // Valiadation des conditions. L'aide et le message d'erreur annoncent 4
  // attaquants au plus, comme une attaque groupée en jeu: au-delà, le bot
  // répondait quand même avec une attaque impossible.
  if (moonsize < 3464 || moonsize > 8944 || check_rip || nb_joueur > 4) {
    return 'Erreur dans les paramètres.\n    Usage: !mb <TailleLune> <Nombre_RIP_J1> [<Nombre_RIP_J2>] [<Nombre_RIP_J3>] ... [<Nombre_RIP_JN>]\n\nTaille de la lune compris entre 3464km et 8944km.\nNombre_RIP un nombre entier positif.\nEntre 1 et 4 attaquant(s) au plus.';
  }

  const vague_joueur = [];
  const reste_joueur = [];

  for (let j = 1; j <= nb_joueur; j++) {
    vague_joueur[j - 1] = Math.floor(tab[j] / 6); //Nb de rip par vague
    reste_joueur[j - 1] = tab[j] % 6; //Reste à ajouter aux vagues
  }

  //Les flottes dans l'ordre où elles sont listées, qui est l'ordre de tir.
  const flottes = tab.slice(1, nb_joueur + 1);

  const proba_reussite = arrondi(getMoonbreakChance(moonsize, flottes) * 100); //arrondi au centième

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
