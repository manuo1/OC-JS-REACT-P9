npm install eslint --save-dev

Ajouter dans package.json du front

  "scripts": {
    "dev": "concurrently \"npm run run:dev --prefix ../Billed-app-FR-Back\" \"live-server\""
  },

Et donc pour lancer back + front :
    
    npm run dev 