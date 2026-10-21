/* ===== i18n_it_rules.js ===== */
/* =====================================================================
   HOLLOWDEEP - dynamic Italian string rules
   Applied only when an exact dictionary entry is missing.
   ===================================================================== */

const HD_IT_RULES = [
  /* ------------------------- chapter / floor / HUD ------------------------- */
  [/^CH\.\s*(I|II|III)\s+F(\d+)$/i, m => 'CAP. ' + m[1].toUpperCase() + ' P' + m[2]],
  [/^CH\.\s*(I|II|III)$/i, m => 'CAP. ' + m[1].toUpperCase()],
  [/^CHAPTER\s+(I|II|III)\s*[—–-]\s*(.+)$/i, m => 'CAPITOLO ' + m[1].toUpperCase() + ' — ' + hdTr(m[2])],
  [/^(.+?)\s*·\s*FLOOR\s+(\d+)\s*\/\s*10$/i, m => hdTr(m[1]) + ' · PIANO ' + m[2] + '/10'],
  [/^CHAPTER\s+(I|II|III)$/i, m => 'CAPITOLO ' + m[1].toUpperCase()],
  [/^CHAPTER\s+(\d+)$/i, m => 'CAPITOLO ' + m[1]],
  [/^FLOOR\s+(\d+)\s*\/\s*10$/i, m => 'PIANO ' + m[1] + '/10'],
  [/^FLOOR\s+(\d+)\s*[—–-]\s*(.+)$/i, m => 'PIANO ' + m[1] + ' — ' + hdTr(m[2])],
  [/^FLOOR\s+(\d+)$/i, m => 'PIANO ' + m[1]],
  [/^EPILOGUE\s*[—–-]\s*(.+)$/i, m => 'EPILOGO — ' + hdTr(m[1])],
  [/^CONTINUE\s*[—–-]\s*(.+)$/i, m => 'CONTINUA — ' + hdTr(m[1])],
  [/^ENDING\s+([IVX]+)\s+OF\s+([IVX]+)$/i, m => 'FINALE ' + m[1].toUpperCase() + ' DI ' + m[2].toUpperCase()],
  [/^YOU FELL ON FLOOR\s+(\d+)\s*\/\s*10$/i, m => 'SEI CADUTO AL PIANO ' + m[1] + '/10'],
  [/^YOU WILL RISE AT THE START OF FLOOR\s+(\d+)\.$/i, m => 'RISORGERAI ALL\'INIZIO DEL PIANO ' + m[1] + '.'],
  [/^AN ECHO STILL WAITS ON FLOOR\s+(\d+)\.$/i, m => 'UN\'ECO ATTENDE ANCORA AL PIANO ' + m[1] + '.'],
  [/^ECHO OF VEYRA\s*[—–-]\s*(.+)$/i, m => 'ECO DI VEYRA — ' + hdTr(m[1])],

  /* ------------------------------ story events ------------------------------ */
  [/^WAVE\s+(\d+)\s*\/\s*(\d+)\s*[—–-]\s*(\d+)s$/i, m => 'ONDATA ' + m[1] + '/' + m[2] + ' — ' + m[3] + 's'],
  [/^WAVE\s+(\d+)\s*\/\s*(\d+)$/i, m => 'ONDATA ' + m[1] + '/' + m[2]],
  [/^HOLD THE LIGHT\s*[—–-]\s*WAVE\s*(\d+)\s*\/\s*(\d+)$/i, m => 'TIENI LA LUCE — ONDATA ' + m[1] + '/' + m[2]],
  [/^LIGHT THE SEALS\s*[—–-]\s*(\d+)\s*\/\s*(\d+)$/i, m => 'ACCENDI I SIGILLI — ' + m[1] + '/' + m[2]],
  [/^REPEAT THE RUNES\s*[—–-]\s*(\d+)\s*\/\s*(\d+)$/i, m => 'RIPETI LE RUNE — ' + m[1] + '/' + m[2]],
  [/^SPEAK THE RUNES\s+(\d+)\s*\/\s*(\d+)$/i, m => 'PRONUNCIA LE RUNE ' + m[1] + '/' + m[2]],
  [/^SEAL LIT\s*[—–-]\s*(\d+)\s*\/\s*(\d+)$/i, m => 'SIGILLO ACCESO — ' + m[1] + '/' + m[2]],

  /* -------------------------------- options -------------------------------- */
  [/^GORE LEVEL:\s*(.+)$/i, m => 'LIVELLO GORE: ' + hdTr(m[1])],
  [/^CURRENT:\s*(.+)$/i, m => 'ATTUALE: ' + hdTr(m[1])],
  [/^LEVEL\s+(\d+):\s*(.+)$/i, m => 'LIVELLO ' + m[1] + ': ' + hdTr(m[2])],
  [/^LEVEL\s+(\d+)\s*[—–-]\s*(.+)$/i, m => 'LIVELLO ' + m[1] + ' - ' + hdTr(m[2])],
  [/^MUSIC:\s*(ON|OFF)$/i, m => 'MUSICA: ' + (m[1].toUpperCase() === 'ON' ? 'SÌ' : 'NO')],
  [/^SOUND FX:\s*(ON|OFF)$/i, m => 'EFFETTI: ' + (m[1].toUpperCase() === 'ON' ? 'SÌ' : 'NO')],
  [/^LOOK:\s*(.+)$/i, m => 'ASPETTO: ' + hdTr(m[1])],
  [/^STARTS WITH:\s*(.+)$/i, m => 'INIZIA CON: ' + hdTr(m[1])],

  /* ------------------------------- multiplayer ------------------------------- */
  [/^START\s*\((\d+)\s*\/\s*(\d+)\)$/i, m => 'INIZIA (' + m[1] + '/' + m[2] + ')'],
  [/^P(\d+)\s*\(YOU\)$/i, m => 'P' + m[1] + ' (TU)'],
  [/^P(\d+)\s+IS DOWN!\s+HOLD E TO REVIVE$/i, m => 'P' + m[1] + ' È A TERRA! TIENI E PER RIANIMARE'],
  [/^P(\d+)\s+IS DOWN$/i, m => 'P' + m[1] + ' È A TERRA'],
  [/^P(\d+)\s+REVIVED!$/i, m => 'P' + m[1] + ' RIANIMATO!'],
  [/^P(\d+)\s+LEFT THE GAME$/i, m => 'P' + m[1] + ' HA LASCIATO LA PARTITA'],
  [/^BOSS:\s*(.*)$/i, m => 'BOSS: ' + hdTr(m[1])],
  [/^TEAM:\s*(.*)$/i, m => 'SQUADRA: ' + hdTr(m[1])],

  /* ------------------------------- score / record ------------------------------- */
  [/^ENEMIES SLAIN\s+(\d+)\s*[—–-]\s*COINS\s+(\d+)$/i, m => 'NEMICI UCCISI ' + m[1] + ' - MONETE ' + m[2]],
  [/^REACHED FLOOR\s+(\d+)\s*\/\s*(\d+)$/i, m => 'PIANO RAGGIUNTO ' + m[1] + '/' + m[2]],
  [/^-\s*NEW BEST!$/i, m => '- NUOVO RECORD!'],
  [/^CYCLE\s+(\d+)\s*·\s*KILLS\s+(\d+)\s*·\s*DEATHS\s+(\d+)\s*·\s*EMBERS\s+(\d+)\s*·\s*SHARDS\s+(\d+)\s*\/\s*3\s*·\s*ENDINGS\s+(\d+)\s*\/\s*4$/i,
    m => 'CICLO ' + m[1] + ' · UCCISIONI ' + m[2] + ' · MORTI ' + m[3] + ' · BRACI ' + m[4] + ' · FRAMMENTI ' + m[5] + '/3 · FINALI ' + m[6] + '/4'],

  /* ------------------------------ camp / weapon ------------------------------ */
  [/^(\d+)\s+E$/, m => m[1] + ' B'],
  [/^(.+?)\s{2,}DMG\s+(\d+)$/i, m => hdTr(m[1]) + '  DANNO ' + m[2]],
  [/^(.+)\s+RAISED\.$/i, m => hdTr(m[1]) + ' AUMENTATA.'],
  [/^(\d+)\.\s+(.+)$/, m => m[1] + '. ' + hdTr(m[2])],

  /* --------------------------- engine UI fragments --------------------------- */
  [/^Could not open the room:\s*(.*)$/i, m => 'Impossibile aprire la stanza: ' + m[1]],
  [/^THE DEEP\s*[—–-]\s*LORE$/i, m => 'IL PROFONDO — LORE'],

  /* ------------------------- generic composed label ------------------------- */
  [/^(.+?)\s*[—–]\s*(.+)$/, m => {
    const a = hdTr(m[1]);
    const b = hdTr(m[2]);
    if (a === m[1] && b === m[2]) return null;
    return a + ' — ' + b;
  }]
];
