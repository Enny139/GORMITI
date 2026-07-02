# Gormiti Checklist

Questa è una web app installabile (PWA) per gestire la collezione Gormiti.

## Cosa contiene

- schermata iniziale divisa per serie;
- serie Final Evolution già inserita;
- card per ogni singolo Gormito con immagine e nome;
- due spunte separate: Personaggio e Carta;
- ricerca, filtri, progressi e backup JSON;
- salvataggio automatico nel browser tramite localStorage.

## Prova sul computer

Apri `index.html` con il browser. Per testare anche la modalità offline/PWA, avvia un piccolo server nella cartella:

```bash
python3 -m http.server 8000
```

poi apri http://localhost:8000

## Uso sul cellulare

Per installarla come app sulla schermata Home serve pubblicare questa cartella su un hosting statico con HTTPS, per esempio Netlify, Vercel o GitHub Pages. Non serve pubblicarla sugli store.

Passaggi generali:

1. Carica tutta la cartella `gormiti_pwa` sull'hosting statico.
2. Apri dal cellulare il link generato.
3. iPhone/Safari: Condividi → Aggiungi a Home.
4. Android/Chrome: menu ⋮ → Aggiungi a schermata Home / Installa app.

## Backup

Nell'app usa `Esporta backup` per salvare le spunte in un file JSON. Usa `Importa backup` per ripristinarle su un altro telefono o browser.
