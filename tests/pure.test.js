import { test } from 'node:test';
import assert from 'node:assert/strict';

import { prettify } from '../utils.js';
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
