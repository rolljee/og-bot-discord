const Ogame = require('ogamejs');

const { prettify } = require('./utils');

function getCommerceMessage(msg) {
  const [command, resource, percent, rate, ...numbers] = msg.split(' ');
  const number = numbers.join('');

  // ogc M|C|D 60/40 2:1.5:1 20 000 000
  if (resource === 'M') {
    const [percentC, percentD] = percent.split('/');
    const response = Ogame.default.Trader.sellMetal(
      number,
      percentD,
      percentC,
      rate,
    );
    const message = `[${rate}] ${prettify(number)} M contre ${prettify(response.crystal)} C ${prettify(response.deut)} D`;
    return message;
  } else if (resource === 'C') {
    const [percentM, percentD] = percent.split('/');
    const response = Ogame.default.Trader.sellCrystal(
      number,
      percentD,
      percentM,
      rate,
    );
    const message = `[${rate}] ${prettify(number)} C contre ${prettify(response.metal)} M ${prettify(response.deut)} D`;
    return message;
  } else if (resource === 'D') {
    const [percentM, percentC] = percent.split('/');
    const response = Ogame.default.Trader.sellDeut(
      number,
      percentM,
      percentC,
      rate,
    );
    const message = `[${rate}] ${prettify(number)} D contre ${prettify(response.metal)} M ${prettify(response.crystal)} C`;
    return message;
  }
}

module.exports = {
  getCommerceMessage,
};
