# FitLife – web app per iPhone (PWA) · versione 2

**Novità v2:** tema chiaro/scuro (bianco o nero + verde smeraldo), home a 4 riquadri riordinabili (trascina ⠿), schede settimanali con riposi e stima di durata/calorie, timer di riposo, calendario, mappa muscolare in rosso, schede esercizio dettagliate, foto del fisico mensili (salvate in IndexedDB) e promemoria peso/foto configurabili. Non è possibile un widget nella Home: servirebbe un'app nativa.

Dieta su misura, diario alimentare, allenamenti e progressi. Si usa da Safari, si aggiunge alla Home come un'app e **funziona offline**. I dati restano solo sul tuo iPhone (localStorage). Nessun server, nessun account, nessun framework: HTML + CSS + JavaScript.

## 1. Mettila online (una volta sola, gratis)
Per installarla su iPhone serve un indirizzo **https**. Il modo più semplice è GitHub Pages:

1. Su github.com crea un repository pubblico, ad esempio `fitlife`.
2. *Add file → Upload files* e trascina **il contenuto** di questa cartella (`index.html`, `sw.js`, `manifest.webmanifest`, `css/`, `js/`, `icons/`), non la cartella stessa. *Commit changes*.
3. *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save*.
4. Dopo circa un minuto l'app è su `https://TUO-UTENTE.github.io/fitlife/`.

(Alternativa senza Git: trascina la cartella su https://app.netlify.com/drop. Il repository è pubblico ma contiene solo il codice, mai i tuoi dati.)

## 2. Installala sull'iPhone
1. Apri l'indirizzo **con Safari** (non Chrome).
2. Tocca *Condividi* ⬆️ → **Aggiungi alla schermata Home** → *Aggiungi*.
3. Apri FitLife dall'icona. La prima volta serve internet; poi funziona anche offline.

## 3. Backup
Profilo → **Esporta backup** salva un file `.json` (puoi salvarlo in File/iCloud o inviartelo). Se cambi telefono o cancelli i dati di Safari, lo reimporti dalla schermata di benvenuto o da Profilo → *Importa backup*. Fai un backup ogni tanto.

## 4. Provarla sul Mac / modificarla in IntelliJ
- Apri la cartella in IntelliJ, tasto destro su `index.html` → *Open in → Browser*; oppure da terminale: `python3 -m http.server 8000` e vai su http://localhost:8000.
- Dopo una modifica ai file online, **cambia `VERSION` in `sw.js`** (es. `fitlife-v3`), ricarica i file su GitHub e apri l'app due volte sull'iPhone per vedere l'aggiornamento.

## Dove modificare le cose
| Cosa | File |
|---|---|
| Alimenti, ricette, esercizi, pose degli omini | `js/data.js` |
| Muscoli primari/secondari e testi degli esercizi | `js/exinfo.js` |
| Mappa anatomica (fronte/retro) | `js/body.js` |
| Schede, stimoli muscolari, consigli, calendario | `js/plan.js` |
| Formule kcal/macro, generatore del menu, spesa | `js/logic.js` |
| Illustrazioni (cibi, piatti, omini animati) | `js/art.js` |
| Schermate e azioni | `js/ui.js` |
| Salvataggio e backup | `js/store.js` |
| Aspetto | `css/style.css` |

## Note
- Le calorie usano la formula di Mifflin‑St Jeor (−15% per dimagrire, +10% per la massa). Valori nutrizionali approssimati: non sostituiscono medico o dietista.
- L'allenamento in corso viene salvato come bozza e si riprende anche se chiudi l'app.

- Aggiornamento dalla v1: ricarica su GitHub tutti i file (anche i nuovi `js/body.js`, `js/exinfo.js`, `js/plan.js`) e apri l'app due volte. I dati esistenti restano.
- I backup v2 includono le foto (file più pesante). I promemoria compaiono nella Home all'apertura dell'app: iOS non consente notifiche senza un server.
