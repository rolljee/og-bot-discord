function parseInput(msg) {
	const split = msg.split(" "); //Split des arguments

	const moonsize = parseInt(split[0], 10); //Int_of_String de arg1
	const nbrip = parseInt(split[1], 10);    //Int_of_String de arg2

	return { moonsize, nbrip };
}

function getLossesStats(moonsize, nbrip) {
	//Estimation des pertes

	//proba d'echec d'une vague moyenne de rip
	const proba_moyenne = (100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip / 6) / 100;
	const proba_echec_moy = 1 - proba_moyenne;

	//proba de destruction d'une vague de rip moyenne
	const proba_destr = Math.sqrt(moonsize) / 200;

	//somme des pertes
	let pertes = 0

	//les pertes sont calculé itérativement: nbrip_moy * proba_destr * proba que les vagues d'avant échouent
	for (let i = 0; i < 6; i++) {
		pertes = pertes + (nbrip / 6) * proba_destr * (proba_echec_moy ** (i));
	}

	//arrondi des pertes au centiemes
	pertes = Math.round(100 * pertes) / 100;

	return pertes;
}

function moonBreak(message) {
	const msg = message.substring(4);
	const { moonsize, nbrip } = parseInput(msg);


	// Valiadation des conditions
	if (moonsize <= 3464 || moonsize >= 8944 || nbrip < 0) {
		return "Erreur dans les paramètres:\nMoonsize€[3464;8944] & Nb_RIP€[1;2000].";
	}


	let proba_mb = 1;
	let proba_echec = 1;
	let proba_full_echec = 1;                   //proba initiale que x mb echouent

	const nbrip_vague = Math.floor(nbrip / 6);    //Nb de rip par vague
	const nbrip_reste = nbrip % 6;                //Reste à ajouter aux vagues

	if (nbrip_reste === 0) {  //S'il n'y a pas de reste, on calcul la proba des 6vagues consécutives de y RIPs

		//Proba pourcent de moonbreak (formule officielle)
		proba_mb = ((100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague)) / 100;
		if (proba_mb > 1) { proba_mb = 1; }                             //Caution si la proba est > 1

		proba_echec = 1 - proba_mb;                               //proba d'echec

		proba_full_echec = proba_full_echec * (proba_echec ** 6); //proba d'echec des 6 vagues consécutives
	}
	else {  //S'il y a des restes on calcul d'abord la proba d'échec des r vagues de nbrip_vague+1 RIP puis les 6-r autres vagues de nbrip_vague

		//proba pourcent de mb (formule officielle) pour une vague de nbrip_vague+1
		proba_mb = ((100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague + 1)) / 100;
		if (proba_mb > 1) { proba_mb = 1; }                                       //Caution si la proba est > 1

		proba_echec = 1 - proba_mb;                                         //proba d'échec

		proba_full_echec = proba_full_echec * (proba_echec ** nbrip_reste); //proba d'échec des r vagues de y+1 RIP consécutives


		//proba pourcent de mb (formule officielle) pour une vague de nbrip_vague
		proba_mb = (100 - Math.sqrt(moonsize)) * Math.sqrt(nbrip_vague) / 100;
		if (proba_mb > 1) { proba_mb = 1; }                                         //Caution si la proba est > 1

		proba_echec = 1 - proba_mb;                                           //proba d'échec

		proba_full_echec = proba_full_echec * (proba_echec ** (6 - nbrip_reste)); //proba d'echec des r vagues de y+1 RIP et 6-r vagues consécutives de y RIPs
	}

	const proba_reussite = Math.round((1 - proba_full_echec) * 10000) / 100; //calcul de la proba de ne pas echouer tout arrondi au centième

	let mbspeak = '';

	if (nbrip >= 6) { //préparation du msg de retour

		switch (nbrip_reste) {
			case 0:
				mbspeak = "Réussite du MoonBreak (" + moonsize + "km): **" + proba_reussite + "%** avec 6 vagues de " + nbrip_vague + " RIP.";
				break;
			case 1:
				mbspeak = "Réussite du MoonBreak (" + moonsize + "km): **" + proba_reussite + "%** avec 1 vague de " + (nbrip_vague + 1) + " et 5 vagues de " + nbrip_vague + " RIP.";
				break;
			case 5:
				mbspeak = "Réussite du MoonBreak (" + moonsize + "km): **" + proba_reussite + "%** avec 5 vagues de " + (nbrip_vague + 1) + " et 1 vague de " + nbrip_vague + " RIP.";
				break;
			default:
				mbspeak = "Réussite du MoonBreak (" + moonsize + "km): **" + proba_reussite + "%** avec " + nbrip_reste + " vagues de " + (nbrip_vague + 1) + " et " + (6 - nbrip_reste) + " vagues de " + nbrip_vague + " RIP.";
		}

	}
	else {

		if (nbrip_reste === 1) {
			mbspeak = "Réussite du MoonBreak (" + moonsize + "km): **" + proba_reussite + "%** avec 1 vague de " + (nbrip_vague + 1) + " RIP.";
		}
		else {
			mbspeak = "Réussite du MoonBreak (" + moonsize + "km): **" + proba_reussite + "%** avec " + nbrip_reste + " vagues de " + (nbrip_vague + 1) + " RIP.";
		}

	}

	const pertes = getLossesStats(moonsize, nbrip);

	mbspeak += "\n    => *Pertes estimées:* ***" + pertes + "*** *RIP détruite(s)*";

	return mbspeak;
}

module.exports = {
	moonBreak
}
