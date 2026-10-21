# Hollowdeep — port nativo per PS Vita

Port **nativo** di *Hollowdeep — The Lantern Below* su PlayStation Vita.
Niente browser e niente motore web: è un'applicazione VitaSDK (`.vpk`) che contiene
il gioco e lo esegue con un rasterizzatore Canvas2D scritto in C.

## Come è fatto

| Componente | Ruolo |
|---|---|
| `vita/source/main_vita.c` | entry point VitaSDK, input, presentazione 2× nearest, 30 fps |
| `vita/source/runtime.c` | runtime QuickJS + bridge nativo (`__g`), storage, bootstrap |
| `vita/source/canvas.c` | rasterizzatore Canvas2D software 352×240 (path, gradienti, testo TTF, immagini PNG) |
| `vita/js/shim.js` | shim minimale delle API browser usate dal gioco (canvas, DOM, eventi, timer, localStorage, `Image`) |
| `vita/js/ui.js` | ridisegno nativo dei menu e dei dialoghi cinematografici |
| `vita/assets/game_*.js` | script originali estratti da `Hollowdeep.html` (motore, storia, i18n) |
| `vita/third_party/quickjs` | motore JS ES2020 (MIT) compilato per ARM Vita |
| `vita/third_party/stb_*` | decoder PNG e rasterizzatore TrueType (public domain/MIT) |

Il gioco **non è stato riscritto**: la logica (combattimento, piani, boss, scelte,
salvataggi, modalità storia e classica) è la stessa del file HTML, eseguita da
QuickJS. Il port sostituisce solo il livello di presentazione:

- le 15 `<script>` di `Hollowdeep.html` vengono estratte e incorporate nel binario;
- `canvas` 2D, `drawImage`, gradienti, testo e trasformazioni sono implementati in C;
- i menu che nel browser sono HTML/CSS vengono impaginati e disegnati sul canvas
  dallo stesso albero di elementi che il gioco costruisce;
- lo stato (`localStorage`) finisce in `ux0:data/Hollowdeep/store.json`.

## Installazione

1. Scarica `Hollowdeep.vpk` dalla sezione **Releases**.
2. Copialo sulla Vita (FTP/USB) e installalo con **VitaShell**.
3. Avvia *Hollowdeep* dal LiveArea.

Requisiti: Vita con HENkaku/Enso (qualsiasi firmware homebrew), ~10 MB liberi.

## Controlli

| Vita | Azione |
|---|---|
| Stick sinistro / D-Pad | muoversi, navigare i menu |
| ✕ | attaccare / confermare / avanzare nei dialoghi |
| ○ | indietro, pausa, salta scena |
| □ | interagire (E) |
| △ | pulse della lanterna (Q) |
| L | scatto (Shift) |
| R | attacco alternativo (J) |
| START | pausa |
| SELECT | muto |

La mira usa la direzione di movimento, come nella modalità tastiera del gioco PC.

## Stato del port

Funzionante:
- modalità storia completa (capitoli, scene, dialoghi, scelte, finali);
- modalità classica (10 piani, boss, campo, diario, opzioni);
- localizzazione IT/EN e salvataggi persistenti;
- menu, schermata eroi, pausa, game over ridisegnati nativamente.

Limiti noti:
- **audio non ancora portato**: la colonna sonora è sintetizzata con WebAudio e in
  questa versione il gioco gira in silenzio;
- **multiplayer online disabilitato** (richiede WebRTC/WebSocket);
- i menu sono ridisegnati con layout nativo: fedeli a contenuti e gerarchia, non
  pixel-identici al CSS originale;
- il touch screen non è usato: si gioca con i tasti.

## Compilazione

La build gira su GitHub Actions (immagine ufficiale `vitasdk/vitasdk`), senza
toolchain locale:

```bash
make -C vita host   # runtime headless + screenshot di verifica
make -C vita vpk    # pacchetto PS Vita
```

Il workflow `.github/workflows/build.yml`:

1. estrae gli asset da `Hollowdeep.html` (`tools/extract_assets.py`);
2. genera icona e LiveArea (`tools/make_vita_art.py`);
3. esegue il **self-test headless** con lo stesso runtime della Vita
   (`tools/local_test.js` + `vita/build/hollowdeep_host`) e salva gli screenshot;
4. compila il VPK con VitaSDK;
5. pubblica VPK e screenshot **direttamente nella Release** (nessun artifact).

## Crediti

Gioco originale **Hollowdeep** di Sanciopanza — <https://github.com/SancioPanza88>.
Font *Press Start 2P* (SIL Open Font License). QuickJS (MIT), stb (public domain/MIT).
