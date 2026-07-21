import Ogame from 'ogamejs';

import { prettify } from './utils.js';

export function getCommerceMessage(msg) {
  const [, resource, percent, rate, ...numbers] = msg.split(' ');
  const number = numbers.join('');

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
