import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseNamedCommand, prettify, stripQuotes } from '../utils.js';
import { moonBreak, vaguesAttaque } from '../mb.js';
import { getCommerceMessage } from '../commerce.js';
import { UserError } from '../errors.js';

test('prettify groups thousands with dots', () => {
  assert.equal(prettify(1000000), '1.000.000');
  assert.equal(prettify(999), '999');
  assert.equal(prettify(1234), '1.234');
});

test('moonBreak returns a success probability for valid input', () => {
  const out = moonBreak('!mb 5000 100');
  assert.match(out, /% de réussite du MoonBreak/);
  assert.match(out, /5000km/);
});

test('moonBreak supports several attackers', () => {
  const out = moonBreak('!mb 8000 50 50');
  assert.match(out, /2 attaquants/);
});

test('moonBreak caps the wave success probability at 1', () => {
  // Petite lune + beaucoup de RIP par vague: la proba de réussite dépassait 1,
  // ce qui rendait la proba d'échec négative (pertes négatives, bandes NaN).
  const out = moonBreak('!mb 3464 200');
  assert.match(out, /Pertes moyennes: 10\.01 RIP/);
  assert.match(out, /68% de chance de perdre entre\* 7\.35 \*et\* 12\.66/);
  assert.doesNotMatch(out, /NaN|-\d/);
});

test('vaguesAttaque donne six vagues par attaquant, les plus grosses en tete', () => {
  assert.deepEqual(vaguesAttaque([25]), [5, 4, 4, 4, 4, 4]);
  assert.deepEqual(vaguesAttaque([24]), [4, 4, 4, 4, 4, 4]);
  // Moins de 6 RIP: les vagues vides ne menacent pas la lune et ne coutent rien.
  assert.deepEqual(vaguesAttaque([1]), [1, 0, 0, 0, 0, 0]);
});

test('vaguesAttaque enchaine les attaquants dans l\'ordre liste', () => {
  assert.deepEqual(vaguesAttaque([2, 12]), [1, 1, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2]);
});

test('vaguesAttaque ne perd aucune RIP en route', () => {
  assert.equal(vaguesAttaque([37, 8, 100]).reduce((a, b) => a + b, 0), 145);
});

const pertesDe = (out) => Number(out.match(/Pertes moyennes: ([\d.]+)/)[1]);
const probaDe = (out) => Number(out.match(/([\d.]+)% de réussite/)[1]);

// Les pertes se calculaient sur une taille de vague moyenne, donc aveugles au
// partage de la flotte: 101 RIP en 1 + 100 donnaient les memes pertes qu'en
// 50 + 50, alors que la proba de casser la lune passe de 79 % a 87 %.
test('moonBreak distingue une attaque desequilibree d\'une attaque repartie', () => {
  const desequilibree = moonBreak('!mb 8944 1 100');
  const repartie = moonBreak('!mb 8944 50 51');

  assert.ok(probaDe(repartie) > probaDe(desequilibree));
  // Reparties, les vagues sont plus petites, la lune tombe plus tot et moins de
  // vagues partent: ca coute moins cher.
  assert.ok(pertesDe(repartie) < pertesDe(desequilibree));
});

test('moonBreak fait payer plus cher l\'attaquant qui ouvre', () => {
  // Les attaquants tirent dans l'ordre liste: envoyer les 100 en premier expose
  // ses six vagues pleines a une lune encore debout.
  assert.ok(pertesDe(moonBreak('!mb 8944 100 1')) > pertesDe(moonBreak('!mb 8944 1 100')));
});

test('moonBreak rejects out-of-range moon size', () => {
  const out = moonBreak('!mb 1000 100');
  assert.match(out, /Erreur dans les paramètres/);
});

test('moonBreak rejects when no attacker is given', () => {
  const out = moonBreak('!mb 5000');
  assert.match(out, /Erreur dans les paramètres/);
});

test('getCommerceMessage converts metal into other resources', () => {
  const out = getCommerceMessage('!ogc M 60/40 2:1.5:1 1000000');
  assert.match(out, /1\.000\.000 M contre/);
  assert.match(out, / C /);
  assert.match(out, / D$/);
});

test('getCommerceMessage handles crystal and deut', () => {
  assert.match(getCommerceMessage('!ogc C 60/40 2:1.5:1 1000000'), /C contre/);
  assert.match(getCommerceMessage('!ogc D 60/40 2:1.5:1 1000000'), /D contre/);
});

// `4:3:2` est le meme taux que `2:1.5:1`. ogamejs < 4.0.1 lisait les termes
// bruts du cote deut, donc `!ogc D` payait le double au meme taux.
test('getCommerceMessage lit un taux remis a l\'echelle comme le meme taux', () => {
  const montants = (out) => out.match(/[\d.]+ [MCD]\b/g);

  assert.deepEqual(
    montants(getCommerceMessage('!ogc D 60/40 4:3:2 1000000')),
    montants(getCommerceMessage('!ogc D 60/40 2:1.5:1 1000000')),
  );
});

// ogamejs leve sur ces taux depuis 4.0.2; sans garde-fou index.js repondrait
// l'aide generique, sans dire que c'est le taux qui cloche.
test('getCommerceMessage explique un taux inutilisable', () => {
  for (const rate of ['0:1.5:1', '2::1', '-2:1.5:1', '2:1.5', 'abc']) {
    assert.throws(
      () => getCommerceMessage(`!ogc M 60/40 ${rate} 1000000`),
      (error) => error instanceof UserError && /Taux inutilisable/.test(error.message),
      `taux accepte a tort: ${rate}`,
    );
  }
});

test('parseNamedCommand keeps multi-word names', () => {
  assert.deepEqual(parseNamedCommand('!ogp 282 fr Procurator Pavo'), {
    universe: '282',
    lang: 'fr',
    name: 'Procurator Pavo',
  });
});

test('parseNamedCommand strips quotes around the name', () => {
  // Discord passe les guillemets tels quels, la recherche par nom exact échouait.
  assert.equal(parseNamedCommand('!ogp 282 fr "Procurator Pavo"').name, 'Procurator Pavo');
  assert.equal(parseNamedCommand('!ogp 282 fr “Procurator Pavo”').name, 'Procurator Pavo');
  assert.equal(parseNamedCommand('!ogp 282 fr \'Procurator Pavo\'').name, 'Procurator Pavo');
});

test('parseNamedCommand tolerates extra whitespace', () => {
  assert.equal(parseNamedCommand('  !ogp  282   fr   Procurator Pavo  ').name, 'Procurator Pavo');
});

test('parseNamedCommand rejects incomplete commands', () => {
  assert.throws(() => parseNamedCommand('!ogp'));
  assert.throws(() => parseNamedCommand('!ogp 282'));
  assert.throws(() => parseNamedCommand('!ogp 282 fr'));
  assert.throws(() => parseNamedCommand('!ogp 282 fr ""'));
});

test('stripQuotes leaves unquoted and asymmetric input alone', () => {
  assert.equal(stripQuotes('Procurator Pavo'), 'Procurator Pavo');
  assert.equal(stripQuotes('"Procurator Pavo'), '"Procurator Pavo');
  assert.equal(stripQuotes('L’Empire'), 'L’Empire');
});
