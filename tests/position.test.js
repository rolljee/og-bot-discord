import { test } from 'node:test';
import assert from 'node:assert/strict';

import { UserError } from '../errors.js';
import { parsePositionCommand, resolveReference } from '../position.js';
import { describeGap, findNearestAllies, isAvailable, parseCoords } from '../position.utils.js';

const shape = { galaxies: 6, systems: 499, donutGalaxy: true, donutSystem: true };

test('parseCoords lit les coordonnées, crochets tolérés', () => {
  assert.deepEqual(parseCoords('2:6:15'), { galaxy: 2, system: 6, position: 15 });
  assert.deepEqual(parseCoords('[2:6:15]'), { galaxy: 2, system: 6, position: 15 });
  assert.equal(parseCoords('2:6'), null);
  assert.equal(parseCoords('0:6:15'), null);
  assert.equal(parseCoords(undefined), null);
});

test('parsePositionCommand sépare la position et le nom sur plusieurs mots', () => {
  assert.deepEqual(parsePositionCommand('!ogpos 282 fr 2:6:15 "Darth Vader"'), {
    universe: '282', lang: 'fr', target: { galaxy: 2, system: 6, position: 15 }, query: 'Darth Vader',
  });
  assert.equal(parsePositionCommand('!ogpos 282 fr 2:6:15').query, '');
  assert.throws(() => parsePositionCommand('!ogpos 282 fr Rolljee'), UserError);
});

test('isAvailable écarte vacances, inactifs et bannis', () => {
  assert.equal(isAvailable(''), true);
  assert.equal(isAvailable('o'), true);
  for (const status of ['v', 'i', 'I', 'vI', 'vib']) {
    assert.equal(isAvailable(status), false, status);
  }
});

test('describeGap prend le chemin court dans un univers circulaire', () => {
  const from = { galaxy: 2, system: 3, position: 1 };
  assert.equal(describeGap(from, { galaxy: 2, system: 3, position: 9 }, shape), 'même système');
  assert.equal(describeGap(from, { galaxy: 2, system: 4, position: 9 }, shape), '1 système');
  assert.equal(describeGap(from, { galaxy: 2, system: 498, position: 9 }, shape), '4 systèmes');
  assert.equal(describeGap(from, { galaxy: 6, system: 3, position: 9 }, shape), '2 galaxies');
});

test('findNearestAllies garde la planète la plus proche de chaque allié, lune en tête à égalité', () => {
  const allies = new Map([['1', 'Alpha'], ['2', 'Beta'], ['3', 'Gamma']]);
  const planets = [
    { player: '1', coords: '2:50:1' },
    { player: '1', coords: '2:8:4' },
    { player: '2', coords: '2:497:7' }, // 8 systèmes par le tour
    { player: '3', coords: '2:4:4' }, // même distance qu'Alpha (2:8:4), mais sans lune
    { player: '3', coords: '2:8:4', moon: 8000 },
    { player: '9', coords: '2:6:14' }, // pas un allié
  ];

  const result = findNearestAllies({ target: { galaxy: 2, system: 6, position: 15 }, planets, allies, shape });

  assert.deepEqual(result.map(r => [r.name, `${r.coords.system}`, Boolean(r.moon)]), [
    ['Gamma', '8', true],
    ['Alpha', '8', false],
    ['Beta', '497', false],
  ]);
});

test('findNearestAllies respecte la limite', () => {
  const allies = new Map([['1', 'A'], ['2', 'B'], ['3', 'C']]);
  const planets = [...allies.keys()].map((id, i) => ({ player: id, coords: `1:${i + 1}:1` }));
  assert.equal(findNearestAllies({ target: { galaxy: 1, system: 1, position: 1 }, planets, allies, limit: 2 }).length, 2);
});

test('resolveReference: propriétaire, joueur, [TAG] puis nom d\'alliance', () => {
  const players = [
    { id: '10', name: 'Rolljee', alliance: '500' },
    { id: '11', name: 'Solo' },
    { id: '12', name: 'TAG', alliance: '501' },
  ];
  const alliances = [{ id: '500', name: 'Aube Galactique', tag: 'AG' }, { id: '501', name: 'Autre', tag: 'TAG' }];
  const planets = [{ player: '10', coords: '2:6:15' }];
  const target = { galaxy: 2, system: 6, position: 15 };
  const base = { target, players, alliances, planets, server: 's282-fr' };

  assert.equal(resolveReference({ ...base, query: '' }).player.name, 'Rolljee');
  assert.equal(resolveReference({ ...base, query: 'Rolljee' }).alliance.tag, 'AG');
  assert.equal(resolveReference({ ...base, query: 'Aube Galactique' }).alliance.tag, 'AG');
  assert.equal(resolveReference({ ...base, query: '[AG]' }).player, null);
  // Un joueur nommé comme un tag gagne, sauf avec les crochets.
  assert.equal(resolveReference({ ...base, query: 'TAG' }).player.name, 'TAG');
  assert.equal(resolveReference({ ...base, query: '[TAG]' }).player, null);

  assert.throws(() => resolveReference({ ...base, query: 'Solo' }), /n'a pas d'alliance/);
  assert.throws(() => resolveReference({ ...base, query: 'Inconnu' }), UserError);
  assert.throws(() => resolveReference({ ...base, query: '', target: { galaxy: 1, system: 1, position: 9 } }), /Personne en 1:1:9/);
});
