import Ogame from 'ogamejs';

import { UserError } from './errors.js';
import { prettify } from './utils.js';

// ogamejs refuse un taux dont un terme ne décrit pas un échange (`0:1.5:1`,
// `2::1`, un terme négatif). Sans ce contrôle l'erreur remonterait à index.js,
// qui répondrait le message d'aide générique: l'utilisateur verrait la syntaxe
// de toutes les commandes sans savoir que c'est son taux qui cloche.
function checkRate(rate) {
  const terms = String(rate ?? '').split(':');

  if (terms.length !== 3 || terms.some((term) => !(Number(term) > 0))) {
    throw new UserError(
      `Taux inutilisable: \`${rate}\`.\nIl s'écrit \`métal:cristal:deut\`, avec trois nombres strictement positifs — par exemple \`2:1.5:1\`.`,
    );
  }
}

export function getCommerceMessage(msg) {
  const [, resource, percent, rate, ...numbers] = msg.split(' ');
  const number = numbers.join('');

  checkRate(rate);

  // ogc M|C|D 60/40 2:1.5:1 20 000 000
  if (resource === 'M') {
    const [percentC, percentD] = percent.split('/');
    const response = Ogame.Trader.sellMetal(
      number,
      percentD,
      percentC,
      rate,
    );
    return `[${rate}] ${prettify(number)} M contre ${prettify(response.crystal)} C ${prettify(response.deut)} D`;
  } else if (resource === 'C') {
    const [percentM, percentD] = percent.split('/');
    const response = Ogame.Trader.sellCrystal(
      number,
      percentD,
      percentM,
      rate,
    );
    return `[${rate}] ${prettify(number)} C contre ${prettify(response.metal)} M ${prettify(response.deut)} D`;
  } else if (resource === 'D') {
    const [percentM, percentC] = percent.split('/');
    const response = Ogame.Trader.sellDeut(
      number,
      percentM,
      percentC,
      rate,
    );
    return `[${rate}] ${prettify(number)} D contre ${prettify(response.metal)} M ${prettify(response.crystal)} C`;
  }
}
