// This file is the entry point for the backend server
// It loads environment variables and starts the Hono server

// Load environment variables from .env file
require("dotenv").config();

// Check if OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "❌ ERREUR : OPENAI_API_KEY n'est pas défini dans le fichier .env"
  );
  console.log(
    "\x1b[33m%s\x1b[0m",
    "⚠️ Veuillez créer un fichier .env dans le répertoire racine avec votre clé API OpenAI.:"
  );
  console.log("\x1b[36m%s\x1b[0m", "OPENAI_API_KEY=openai_api_key_here");
  process.exit(1);
}

console.log(
  "\x1b[32m%s\x1b[0m",
  "✅ Clé API OpenAI trouvée dans les variables d'environnement"
);

// Import and start the Hono server
const { serve } = require("@hono/node-server");
const { default: app } = require("./hono");

const port = process.env.PORT || 3000;

console.log(
  `\x1b[34m%s\x1b[0m`,
  `🚀 Démarrage du serveur backend sur le port ${port}...`
);
console.log(
  `\x1b[34m%s\x1b[0m`,
  `📡 L'API est disponible à l'adresse suivante http://localhost:${port}/api/trpc`
);

serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: "0.0.0.0",
});

console.log(
  "\x1b[32m%s\x1b[0m",
  `✅ Le serveur backend fonctionne sur le port ${port}`
);
