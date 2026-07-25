import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseNamedCommand, prettify, stripQuotes } from '../utils.js';
import { moonBreak } from '../mb.js';
import { getCommerceMessage } from '../commerce.js';

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
  assert.match(out, /Pertes moyennes: 9\.81 RIP/);
  assert.match(out, /68% de chance de perdre entre\* 7\.18 \*et\* 12\.44/);
  assert.doesNotMatch(out, /NaN|-\d/);
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
