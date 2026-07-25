import { createServer } from 'node:http';

// Scaleway Serverless Containers exige qu'un port soit en écoute sur 0.0.0.0,
// sinon le déploiement échoue. Le bot n'ayant aucune API publique, ce serveur
// ne sert qu'à ça — et à signaler l'état réel de la connexion gateway.
//
// /health répond 200 seulement quand discord.js est connecté. La sonde
// Scaleway tolère 10 échecs espacés de 30 s (voir og-bot-discord.tf), ce qui
// laisse 5 minutes pour démarrer tout en faisant recycler le container si la
// gateway meurt définitivement.
export function startHealthServer(client, port = Number(process.env.PORT) || 8080) {
  const server = createServer((req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404).end();
      return;
    }

    const ready = client.isReady();

    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      status: ready ? 'ok' : 'connecting',
      user: client.user?.tag ?? null,
      guilds: ready ? client.guilds.cache.size : 0,
      uptime: Math.round(process.uptime()),
    }));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Health server listening on 0.0.0.0:${port}`);
  });

  return server;
}
