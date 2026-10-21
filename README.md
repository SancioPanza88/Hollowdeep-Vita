# HOLLOWDEEP — THE LANTERN BELOW

Un'estensione narrativa completa per **Hollowdeep**, costruita sopra il roguelike originale senza rimuoverne le meccaniche. Ashfall non vede l'alba da undici giorni; sotto il villaggio, la città annegata di Veyra continua a ricordare. Qualcosa, nel buio, sta mangiando i nomi dei vivi.

## Avvio

Apri **`Hollowdeep.html`** in un browser moderno (Chrome, Edge, Firefox). Non serve installare nulla, avviare un server o avere una connessione: immagini, font e moduli sono incorporati nel file.

- Il salvataggio è locale (`localStorage`, chiave `hollowdeep_story_v1`).
- Per ricominciare da zero: Menu → Nuova storia, oppure svuota quella chiave dagli strumenti del browser.
- La modalità Classica e il multiplayer originale restano raggiungibili dal menu principale.
- Lingua: usa le bandiere **IT / EN** in alto a destra. La scelta è salvata in `localStorage` con la chiave `hollowdeep_lang_v1`; al primo avvio viene scelto l'italiano se il browser è in italiano, altrimenti l'inglese. La lingua si applica a menu, diario, campo, dialoghi e HUD.

## Contenuti della storia

- **3 capitoli** distribuiti su tutti i **10 piani**: *What the Mud Keeps*, *The Rotting Saint*, *The Ember Crown*.
- **5 classi** giocabili, ciascuna con il proprio stile di combattimento.
- **4 finali**: Dawn, Ashes, The Crown e il finale segreto Forgotten. I finali sbloccati restano nella galleria anche dopo un New Cycle.
- **3 Memory Shards** e **10 Echoes of Veyra** da trovare; alimentano il diario e sbloccano le scelte migliori.
- **Eventi diversi dal solito combattimento**: enigmi a rune, arene a ondate, fughe dal crollo, porte che parlano, specchi e personaggi da convincere.
- **Il campo**: tra un capitolo e l'altro puoi spendere Embers in potenziamenti permanenti per la run, parlare con Mara, il Gravekeeper, Orin e la Ember Witch, e consultare il diario.
- **Diario**: trama, lore, persone, bestiario, echo, shard, finali e statistiche.
- **Morte e ritorno**: puoi riprendere dall'inizio del piano corrente senza perdere la storia.
- Scelte, flag di fiducia e finali si intrecciano: non tutte le opzioni sono disponibili in ogni run.

## Controlli

| Azione | Tastiera / mouse |
|---|---|
| Muoversi | WASD o frecce |
| Mirare | Mouse |
| Attaccare | Click sinistro o Spazio |
| Scattare | Shift |
| Interagire | E |
| Pulse della lanterna (storia) | Q |
| Avanzare nei dialoghi | Spazio, Invio o click |
| Saltare una scena | Esc o SALTA (quando disponibile) |
| Scegliere | Click, 1–4, oppure frecce + Invio |
| Pausa | Esc |
| Campo: potenziamenti | 1–4 |
| Campo: parlare | 5–8 |

Su touch: joystick a sinistra, attacco/dash/E a destra, pulsante Q dedicato nella modalità storia. Il gioco è responsive e il canvas si adatta alla finestra.

## Livelli di gore

Il gore è opzionale e si sceglie da **Menu → Opzioni → Livelli Gore**. Ci sono quattro possibilità:

| Livello | Comportamento |
|---|---|
| **Off** | Nessun sangue, cadavere, viscere o organo. |
| **1 — Restrained** | La versione raffinata: schizzi contenuti, pozze compatte, drippaggio leggero. |
| **2 — Classic** | Il comportamento originale precedente alla rifinitura: sangue più pesante, splatter sui muri, smembramento e organi. |
| **3 — Extreme** | Il livello più violento: più sangue, smembramento, arti, organi, pozze e splatter; la copertura è stata ridotta rispetto al passato per non nascondere l'azione, con nebbia contenuta. |

Il sangue segue la specie della creatura: umani rossi, orchetti e goblin verdi, non-morti marcio/ossa, ghiaccio azzurro, demoni color brace, Hollow King viola-void, lucertole turchese, melme bruno-verde e negromanti viola. Ogni creatura ha i propri organi (forma e colore); gli scheletri non lasciano organi. Il sangue fresco emette vapore e bolle, e le impronte prendono il colore del sangue calpestato e restano visibili più a lungo.

Le casse di legno si rompono in poche schegge con fisica di caduta, rimbalzo e attrito; i bauli del tesoro non producono detriti. La scelta del livello viene salvata in `localStorage`. Si può cambiare in qualsiasi momento dalle opzioni o dalla pausa; cambiando livello la scena viene ripulita dagli effetti attuali. Il valore predefinito resta **Off**.

## Struttura del progetto

| File | Descrizione |
|---|---|
| `Hollowdeep.html` | **Build finale portatile**: tutto incorporato in un solo file. |
| `index.html` | Versione di sviluppo con i moduli separati. |
| `story.js` | Stato, salvataggio, flag, runner delle cutscene e input. |
| `story_cine.js` | Regia delle scene: sfondi, attori, particelle, letterbox. |
| `story_scenes.js` | Prologo, capitoli, eventi, boss, finali, dialoghi al campo. |
| `story_play.js` | Costruzione piani, eventi, boss, campo, morte/retry, finali. |
| `story_ui.js` | Menu, selezione eroe, campo, diario, epilogo, pausa. |
| `story_render.js` | Rendering della storia, HUD, oggetti, arte del campo/epilogo. |
| `i18n.js` | Livello runtime IT/EN: persistenza, cambio lingua, traduzione di menu, cutscene e testo canvas. |
| `i18n_it.js` | Dizionario italiano di base; deve essere caricato prima degli altri moduli linguistici. |
| `i18n_it_2.js` … `i18n_it_6.js` | Blocchi aggiuntivi del dizionario: narrazione, eventi, campo, lore, HUD e testi del motore. |
| `i18n_it_rules.js` | Regole regex per le stringhe dinamiche (piani, ondate, sigilli, statistiche, prompt). |
| `build.js` | Ricostruisce `Hollowdeep.html` dai moduli, rispettando l'ordine di caricamento. |

Per rigenerare la build:

```bash
node build.js
```

La build incorpora anche i dizionari: dopo aver modificato un file `i18n_it*.js`, esegui di nuovo `node build.js`.

## Note tecniche

- Il gioco è un classico script unico: i moduli della storia vengono eseguiti dopo il motore e ne estendono le funzioni globali (`drawWorld`, `update`, `enter`, `descend`, `kill`, `endShow`, `win`, `drawHud`, `draw`).
- La modalità storia è single-player; la modalità classica e il multiplayer Trystero originali sono intatti.
- L'ordine dei moduli linguistici è importante: `i18n_it.js` dichiara il dizionario base, i blocchi successivi lo estendono, `i18n_it_rules.js` aggiunge le regole dinamiche e `i18n.js` applica tutto a runtime.
- L'interfaccia è ottimizzata per **1024×768**, **1440×900** e mobile. Sotto 1080px il menu usa una colonna leggibile e le cutscene occupano l'intero viewport; il diario mantiene un corpo di almeno 12px (11px su mobile).
- Il font **Press Start 2P** è incorporato come WOFF2 (SIL Open Font License).
- Il contenuto include violenza in pixel art; il gore è opzionale, con tre livelli di intensità (oltre a Off) selezionabili nelle impostazioni.

## Crediti

Gioco originale **Hollowdeep** di Sanciopanza — <https://github.com/SancioPanza88>.
Story mode *The Lantern Below*: estensione narrativa costruita sul motore originale.
