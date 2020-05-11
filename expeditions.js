const { parseServerData, prettify } = require('./utils');

function cargoCapacity(speed, points, hasPathFinder) {
	const levels = [
		{ level: 10000, base: 40000 },
		{ level: 100000, base: 500000 },
		{ level: 1000000, base: 1200000 },
		{ level: 5000000, base: 1800000 },
		{ level: 5000000, base: 2400000 },
		{ level: 25000000, base: 3000000 },
		{ level: 50000000, base: 3600000 },
		{ level: 75000000, base: 4200000 },
		{ level: 100000000, base: 5000000 },
	];
	const correspondance = levels.find(level => points < level.level);
	const base = correspondance && correspondance.base ? correspondance.base : levels[8].base;
	const factor = hasPathFinder ? 1.5 * speed * 2 : 1.5 * speed * 1;
	const value = factor * base;

	return Math.max(1E3 * value, 2E5) * 0.001;
}

async function getExpeditions(message) {
	const [command, universe, lang, hyperespace] = message.split(' ');
	const data = await parseServerData(universe, lang);
	const universeSpeed = Number(data.speed);
	const topScore = Number(data.topScore);
	const hyperespaceMultipler = Number(data.cargoHyperspaceTechMultiplier);
	const factor = hyperespace * (hyperespaceMultipler / 100);
	const GT_FRET = 25000;
	const PT_FRET = 5000;

	const maxCapacity = cargoCapacity(universeSpeed, topScore, true);
	const GT_number = Math.ceil(maxCapacity / (GT_FRET * (1 + factor)));
	const PT_number = Math.ceil(maxCapacity / (PT_FRET * (1 + factor)));

	return `
Sur ${data.name} le 1er a ${prettify(topScore)}
Un explorateur avec hyperespace: ${hyperespace} + un pathfinder
Trouvaille maximale: ${prettify(maxCapacity)}
Nombre de GT: ${GT_number}
Nombre de PT: ${PT_number}
	`
}


module.exports = {
	getExpeditions
}
