/* ===== story_ui.js ===== */
/* =====================================================================
   THE LANTERN BELOW — menus, camp, journal, epilogue, death screens
   ===================================================================== */

const HD_SCR_MAIN = SCR.main;
const HD_SCR_OVER = SCR.over;
const HD_SCR_WIN = SCR.win;
const HD_SCR_PAUSE = SCR.pause;

let HD_JOURNAL_BACK = 'main';

const HD_STORY_SO_FAR = {
  1: 'Ashfall has lost its last light. You followed Mara, a lantern spirit, into the drowned city of Veyra. The Hollow is eating the names of the living, one memory at a time. The Gravekeeper waits at the bottom of the crypt.',
  2: 'The Gravekeeper is at rest, or something like it. Below the crypt, the Garden District is choked with a rot that keeps what it loves. A scholar named Orin has been suspended in amber since the city drowned. The Rotting Saint tends the garden.',
  3: 'The garden is behind you. The Ember Halls burn under the city, and the Hollow King sits on a throne made of doors. Mara has stopped pretending she does not know him. The last light is below.'
};

const HD_END_META = {
  dawn: {
    n: 'DAWN', sub: 'THE CITY REMEMBERS. SO DO YOU.',
    d: 'You gave the lantern back to Mara. Aurel put down the city he had carried for three hundred years, and the first real dawn in eleven days broke over Ashfall. Everyone remembered. So did you.'
  },
  ashes: {
    n: 'ASHES', sub: 'SURVIVED. FORGOTTEN.',
    d: 'You broke the crown. The Hollow ended, and everything it had kept ended with it. Veyra, the Gravekeeper, Orin, Mara. You climbed out alive and nameless. The village looked at you as if you were a stranger.'
  },
  crown: {
    n: 'THE CROWN', sub: 'THE CYCLE CONTINUES.',
    d: 'You took the crown. The voices were loud, then quiet, then yours. Mara burned down to a blue spark and went out. The throne fitted you exactly. A hundred years from now, another lantern will come down the stairs.'
  },
  forgotten: {
    n: 'FORGOTTEN', sub: 'THE HOLLOW IS GONE. THE NAME REMAINS.',
    d: 'You spoke Aurel Vane\'s true name. The crown opened like a hand and every name inside went free. The world forgot Veyra, and Mara faded smiling. You woke on the hill with a cold lantern and no memory of why you were crying.'
  }
};

const HD_LORE_ENTRIES = [
  { id: 'ashfall', t: 'ASHFALL', d: 'A village built on the bones of a drowned city. Its lanterns are fed with memory; when the Hollow came, the flames began to eat the names of the people who lit them.' },
  { id: 'hollow', t: 'THE HOLLOW', d: 'Not a monster. A hunger that was once a promise. It eats memory, and what it cannot digest it keeps: names, rooms, the shape of a hand.' },
  { id: 'veyra', t: 'VEYRA', d: 'The city below. It drowned in a single night three hundred years ago. Its streets are still full of people who have forgotten they are dead.' },
  { id: 'seals', t: 'MEMORY SEALS', d: 'The city locked its important memories behind rune-seals. A seal does not keep things safe. It keeps them still.' },
  { id: 'mouths', t: 'THE WHISPERING DOOR', d: 'A door with a hundred mouths. It remembers names and repeats them until someone answers. What answers is rarely the person who was called.' },
  { id: 'orin', t: 'ORIN', d: 'Cartographer, archivist, reluctant immortal. He mapped the Hollow before it mapped him. The amber kept him alive and the rot kept the amber hungry.' },
  { id: 'crown', t: 'THE EMBER CROWN', d: 'A vessel made of names. Aurel forged it to hold a city. A vessel that forgets it is a vessel begins to believe it is a king.' },
  { id: 'aurel', t: 'AUREL VANE', d: 'The first Lamplighter. On the night Veyra drowned he opened his chest and let the city pour in. He has been holding it ever since. He calls it love with nowhere left to go.' },
  { id: 'mara', t: 'MARA', d: 'A lamplighter of Veyra. She lit the lamps while the water rose, and has been holding the light ever since. She is not a ghost. She is a flame that remembers being a woman.' },
  { id: 'gk', t: 'THE GRAVEKEEPER', d: 'He guarded empty graves for three hundred years. He did not know he was dead. A name given freely is the only thing the Hollow cannot digest.' },
  { id: 'garden', t: 'THE GARDEN DISTRICT', d: 'Veyra\'s old pleasure gardens. The flood brought rot, and the rot brought flowers. Every flower is a name. The garden is very proud of its collection.' },
  { id: 'rot', t: 'THE ROT', d: 'A patient green hunger. It does not hate what it eats. It grows toward warm things because it wants to keep them. That is the whole of its theology.' },
  { id: 'saint', t: 'THE ROTTING SAINT', d: 'A priest who promised his congregation they would be remembered. He ate their memories to keep them from the river. The garden is his church now, and the flowers are his choir.' },
  { id: 'forge', t: 'THE EMBER HALLS', d: 'The forge of Veyra. Every flame in the halls is a memory burning down to its last thought. The Ember Witch tends the ones that still have something to say.' },
  { id: 'collapse', t: 'THE COLLAPSE', d: 'When the water reached the roots, the city came down a room at a time. The dark that follows is not water. It is the absence of the rooms that used to be there.' },
  { id: 'mirror', t: 'THE MIRROR OF VEYRA', d: 'It shows the last night, not the viewer. Aurel opened his chest. Mara shouted his name. The crown did not get forged. It grew.' },
  { id: 'throne', t: 'THE THRONE OF DOORS', d: 'A seat made of every door that ever led into Veyra. Each one still whispers. The king has forgotten which side of the door he is on.' }
];

const HD_PEOPLE_ENTRIES = [
  { id: 'mara', t: 'MARA', s: 'THE LANTERN SPIRIT', d: 'She has waited three hundred years for someone who still remembers how to carry a flame. She is not sure whether she wants to save you or be saved.' },
  { id: 'door', t: 'THE WHISPERING DOOR', s: 'A MOUTH IN THE MUD', d: 'It said a name: Aurel. It may have been a warning. It may have been an invitation.' },
  { id: 'gravekeeper', t: 'THE GRAVEKEEPER', s: 'KEEPER OF EMPTY GRAVES', d: 'He asked to be remembered. You either gave him a name or gave him the quiet. Either way he followed you to the fire, or he did not.' },
  { id: 'orin', t: 'ORIN', s: 'CARTOGRAPHER OF THE HOLLOW', d: 'Suspended in amber for thirty years, still taking notes. He wants to see the sun and check his sources.' },
  { id: 'witch', t: 'THE EMBER WITCH', s: 'A PROFESSIONAL', d: 'She offered you a brand that would make the dark see its own reflection. She has standards. She also has a very good fire.' },
  { id: 'aurel', t: 'AUREL VANE', s: 'THE HOLLOW KING', d: 'Your enemy, or a man who could not let a city go. The difference matters more than it should.' },
  { id: 'saint', t: 'THE ROTTING SAINT', s: 'THE GARDEN KEEPS ITS OWN', d: 'He wanted to keep everyone. He succeeded. That was the problem.' }
];

const HD_BEST_ENTRIES = [
  { id: 'goblin', t: 'GOBLIN', d: 'Small, quick, and convinced that your pockets belong to it. Travels in bad company.' },
  { id: 'imp', t: 'IMP', d: 'A zigzag of bad intentions. Hard to hit when it remembers to move sideways.' },
  { id: 'tiny_zombie', t: 'TINY ZOMBIE', d: 'Small enough to be sad. Hungry enough not to be.' },
  { id: 'skelet', t: 'SKELETON', d: 'What the crypt keeps when it cannot keep anything softer.' },
  { id: 'swampy', t: 'SWAMPY', d: 'A drowned thing that never learned it should have stopped moving.' },
  { id: 'muddy', t: 'MUDDY', d: 'The mud here has opinions. Most of them are about your ankles.' },
  { id: 'orc_warrior', t: 'ORC WARRIOR', d: 'A soldier of a kingdom that no longer has a name. Still follows orders.' },
  { id: 'masked_orc', t: 'MASKED ORC', d: 'The mask is not for protection. It is so the Hollow cannot learn its face.' },
  { id: 'chort', t: 'CHORT', d: 'A small horned thing that runs faster than it thinks.' },
  { id: 'orc_shaman', t: 'ORC SHAMAN', d: 'Throws green fire and bad advice. Both are contagious.' },
  { id: 'ice_zombie', t: 'ICE ZOMBIE', d: 'The cold preserved it. The cold is not a kindness.' },
  { id: 'necromancer', t: 'NECROMANCER', d: 'A scholar of the wrong kind of memory. Keeps notes in other people\'s bones.' },
  { id: 'gravekeeper', t: 'THE GRAVEKEEPER', d: 'Guardian of empty graves. He did not know he was dead. He knew he was lonely.' },
  { id: 'saint', t: 'THE ROTTING SAINT', d: 'A garden with a man inside it. The flowers are the congregation.' },
  { id: 'king', t: 'THE HOLLOW KING', d: 'Aurel Vane, first Lamplighter. He held a city in his chest until it became a crown. He is very tired.' }
];

const HD_END_ENTRIES = [
  { id: 'dawn', t: 'DAWN', d: 'Give the lantern to Mara. Trust her. Spare the Gravekeeper. Free Orin. Refuse the brand. See the truth. Carry all three shards.' },
  { id: 'ashes', t: 'ASHES', d: 'Break the crown. Let the Hollow end, and everything it kept end with it.' },
  { id: 'crown', t: 'THE CROWN', d: 'Take the crown. Carry the city. Continue the cycle.' },
  { id: 'forgotten', t: 'FORGOTTEN', d: 'Speak Aurel\'s true name. Requires the mirror\'s truth, Orin\'s friendship, and all three shards.' }
];

const HD_UP_KEYS = ['vit', 'edge', 'swift', 'lamp'];

function hdStoryMeta() {
  const ch = CHAPTERS[STORY.chapter] || CHAPTERS[1];
  return '<div class="storyMeta"><span>CH. ' + HD_ROMAN[STORY.chapter] + '</span><span>FLOOR <b>' + (STORY.floor || 1) + '/10</b></span><span>EMBERS <b>' + (STORY.embers || 0) + '</b></span><span>SHARDS <b>' + (STORY.shards || 0) + '/3</b></span><span>CYCLE <b>' + (STORY.cycle || 1) + '</b></span></div>';
}

function hdCampNpcs() {
  const list = [{ id: 'mara', name: 'MARA', sub: 'The lantern spirit', scene: 'camp_mara' }];
  if (hdFlag('sparedGK')) list.push({ id: 'gk', name: 'GRAVEKEEPER', sub: 'Keeper of empty graves', scene: 'camp_gk' });
  if (hdFlag('orin')) list.push({ id: 'orin', name: 'ORIN', sub: 'Cartographer of the Hollow', scene: 'camp_orin' });
  if ((STORY.campChapter || STORY.chapter) >= 3) list.push({ id: 'witch', name: 'EMBER WITCH', sub: 'A professional, warming her hands', scene: 'camp_witch' });
  return list;
}

function hdOpenJournal(back) {
  HD_JOURNAL_BACK = back || 'main';
  ui('journal');
}

/* -------------------------------- language helpers -------------------------------- */
const HDT = (en, it) => (typeof HD_T === 'function' ? HD_T(en, it) : en);
const HDTR = s => (typeof hdTr === 'function' ? hdTr(String(s == null ? '' : s)) : String(s == null ? '' : s));
const HD_KBD = s => '<span class="k">' + s + '</span>';

const HD_MENU_ICONS = {
  play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 2.2 9.8 6l-6.6 3.8z" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M5.2 2h1.6v3.2H10v1.6H6.8V10H5.2V6.8H2V5.2h3.2z" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2h3.2c.5 0 .8.3.8.8V10c0-.5-.3-.8-.8-.8H2zM10 2H6.8c-.5 0-.8.3-.8.8V10c0-.5.3-.8.8-.8H10z" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M3.4 4h1.2M3.4 5.6h1.2M7.4 4h1.2M7.4 5.6h1.2" stroke="currentColor" stroke-width=".8"/></svg>',
  sword: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M9.4 1 11 2.6 5.6 8 4 6.4z" fill="currentColor"/><path d="M3.4 7 1 9.4 2.6 11 5 8.6z" fill="currentColor"/><path d="M2 6.2 5.8 10" stroke="currentColor" stroke-width="1.3"/></svg>',
  users: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="4" cy="4" r="1.7" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="8.4" cy="4.3" r="1.4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M1.2 10c.1-2 1.4-3 2.8-3s2.7 1 2.8 3M6.8 10c.1-1.5.9-2.4 2-2.4s1.9.9 2 2.4" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
  help: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1"/><path d="M4.6 4.4c0-1.6 2.8-1.7 2.8 0 0 1.2-1.4 1.2-1.4 2.5" fill="none" stroke="currentColor" stroke-width="1"/><path d="M6 9.1v.4" stroke="currentColor" stroke-width="1.2"/></svg>',
  gear: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.2 7.4 2l1.6-.2 1 1.3-.4 1.6.8 1.3-.8 1.3.4 1.6-1 1.3-1.6-.2L6 10.8 4.6 10l-1.6.2-1-1.3.4-1.6L1.6 6l.8-1.3-.4-1.6 1-1.3L4.6 2z" fill="none" stroke="currentColor" stroke-width=".9"/><circle cx="6" cy="6" r="1.7" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
  star: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m6 1.2 1.4 3 3.3.4-2.4 2.3.6 3.3L6 8.6 3.1 10.2l.6-3.3L1.3 4.6l3.3-.4z" fill="currentColor"/></svg>',
  warn: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.6 11 10H1z" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M6 4.4v2.4M6 8.2v.4" stroke="currentColor" stroke-width="1.1"/></svg>'
};

function hdMenuButton(b, i) {
  const cls = 'mb mnBtn' + (b[2] ? ' ' + b[2] : '') + (b[5] ? ' wide' : '');
  return '<div class="' + cls + '" data-i="' + i + '" role="button" tabindex="-1">' +
    '<span class="mnIco">' + (HD_MENU_ICONS[b[4]] || HD_MENU_ICONS.play) + '</span>' +
    '<span class="mnTxt"><span class="mnLbl">' + b[0] + '</span>' +
    (b[3] ? '<span class="mnDesc">' + b[3] + '</span>' : '') + '</span>' +
    '<span class="mnGo">›</span></div>';
}

function hdMenuNav(btns) {
  let h = '<div class="mnGrid">';
  let group = null;
  btns.forEach((b, i) => {
    if (b[6] && b[6] !== group) {
      group = b[6];
      h += '<div class="mnGroup">' + group + '</div>';
    }
    h += hdMenuButton(b, i);
  });
  return h + '</div>';
}

function hdMenuStats(saved) {
  if (!saved) {
    return '<div class="mnStat"><b>3</b><span>' + HDT('CHAPTERS', 'CAPITOLI') + '</span></div>' +
      '<div class="mnStat"><b>10</b><span>' + HDT('FLOORS', 'PIANI') + '</span></div>' +
      '<div class="mnStat"><b>4</b><span>' + HDT('ENDINGS', 'FINALI') + '</span></div>';
  }
  return '<div class="mnStat"><b>' + hdEndingCount() + '/4</b><span>' + HDT('ENDINGS', 'FINALI') + '</span></div>' +
    '<div class="mnStat"><b>' + (STORY.cycle || 1) + '</b><span>' + HDT('CYCLE', 'CICLO') + '</span></div>' +
    '<div class="mnStat"><b>' + (best.s || '—') + '</b><span>' + HDT('BEST SCORE', 'RECORD') + '</span></div>';
}

function hdMainLayout(saved, completed, atCamp, ch, endName, btns) {
  let kick, title, desc;
  if (saved && completed) {
    kick = HDT('THE LANTERN IS QUIET', 'LA LANTERNA È QUIETA');
    title = HDTR(endName || HDT('AN ENDING', 'UN FINALE'));
    desc = HDTR('The story is finished. The epilogue is waiting. Begin another cycle when you are ready to descend again.');
  } else if (saved && atCamp) {
    kick = HDT('THE LAST CAMP', 'L\'ULTIMO ACCAMPAMENTO') + ' · ' + HDT('CHAPTER', 'CAPITOLO') + ' ' + HD_ROMAN[STORY.campChapter || STORY.chapter];
    title = HDTR(ch.name);
    desc = HDTR('A fire above the waterline. Embers to spend. People to talk to. Then down again, into the next chapter.');
  } else if (saved) {
    kick = HDT('CHAPTER', 'CAPITOLO') + ' ' + HD_ROMAN[STORY.chapter] + ' · ' + HDT('FLOOR', 'PIANO') + ' ' + (STORY.floor || 1) + '/10';
    title = HDTR(ch.name);
    desc = HDTR(HD_STORY_SO_FAR[STORY.chapter] || '');
  } else {
    kick = HDT('THE BEGINNING', 'L\'INIZIO');
    title = HDTR('THE LANTERN BELOW');
    desc = HDTR('Ashfall has not seen a dawn in eleven days. The last lantern is dying. Beneath the village, the drowned city of Veyra is still remembering. Something down there has been eating the names of the living.');
  }

  return '<div class="mnShell">' +
    '<section class="mnBrand">' +
      '<div>' +
        '<div class="mnKick">' + HDT('STORY MODE', 'MODALITÀ STORIA') + '</div>' +
        '<div class="mnLogo">HOLLOWDEEP</div>' +
        '<div class="mnSub">' + HDT('A STORY OF MEMORY AND ASH', 'UNA STORIA DI MEMORIA E CENERE') + '</div>' +
        '<div class="mnRule"></div>' +
        '<div class="mnCardK">' + kick + '</div>' +
        '<div class="mnCardT">' + title + '</div>' +
        '<div class="mnCardD">' + desc + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="mnProgress">' + hdMenuStats(saved) + '</div>' +
        '<div class="mnFootL">' + HDT('CREATED BY', 'CREATO DA') + ' SANCIOPANZA · <a href="https://github.com/SancioPanza88" target="_blank" rel="noopener">GITHUB</a> · ' +
          HDT('A STORY MODE', 'UNA MODALITÀ STORIA') + '</div>' +
      '</div>' +
    '</section>' +
    '<section class="mnSide">' +
      '<div class="mnMobileBrand"><b>HOLLOWDEEP</b><span>' + HDT('A STORY OF MEMORY AND ASH', 'UNA STORIA DI MEMORIA E CENERE') + '</span></div>' +
      '<div class="mnTop"><div><div class="mnTopT">' + HDT('MAIN MENU', 'MENU PRINCIPALE') + '</div>' +
        '<div class="mnTopS">' + HDT('Choose a path. The dark can wait.', 'Scegli una via. Il buio può attendere.') + '</div></div>' +
        langSwitchHtml() + '</div>' +
      hdMenuNav(btns) +
      '<div class="mnHint"><span>' + HD_KBD('↑') + HD_KBD('↓') + ' ' + HDT('NAVIGATE', 'NAVIGA') + ' · ' + HD_KBD(HDT('ENTER', 'INVIO')) + ' ' + HDT('SELECT', 'SELEZIONA') + '</span>' +
        '<span class="mnHintR">HOLLOWDEEP · V2.0</span></div>' +
    '</section>' +
  '</div>';
}

/* -------------------------------- main -------------------------------- */
SCR.main = () => {
  const saved = !!(STORY && STORY.started);
  const completed = saved && !!STORY.completed;
  const atCamp = saved && !!STORY.atCamp;
  const ch = saved ? (CHAPTERS[STORY.chapter] || CHAPTERS[1]) : CHAPTERS[1];
  const endName = completed && STORY.ending && HD_ENDINGS[STORY.ending] ? HD_ENDINGS[STORY.ending] : '';

  const buttons = [];
  if (saved) {
    let mainLabel, mainDesc;
    if (completed) {
      mainLabel = HDT('EPILOGUE', 'EPILOGO') + ' — ' + HDTR(endName || HDT('THE END', 'LA FINE'));
      mainDesc = HDT('Read how the story ends', 'Scopri come finisce la storia');
    } else if (atCamp) {
      mainLabel = HDT('CONTINUE', 'CONTINUA') + ' — ' + HDT('CAMP', 'ACCAMPAMENTO');
      mainDesc = HDT('Return to the fire, spend Embers, talk to the survivors', 'Torna al fuoco, spendi Braci, parla con i sopravvissuti');
    } else {
      mainLabel = HDT('CONTINUE', 'CONTINUA') + ' — ' + HDT('FLOOR', 'PIANO') + ' ' + (STORY.floor || 1);
      mainDesc = HDT('Resume your descent into Veyra', 'Riprendi la discesa verso Veyra');
    }
    buttons.push([mainLabel, hdContinueStory, 'primary', mainDesc, 'play', 1, HDT('THE JOURNEY', 'IL VIAGGIO')]);
    buttons.push([HDT('NEW STORY', 'NUOVA STORIA'), () => ui('confirmnew'), '', HDT('Start over. Endings stay unlocked.', 'Ricomincia. I finali restano.'), 'plus', 0, HDT('THE JOURNEY', 'IL VIAGGIO')]);
  } else {
    buttons.push([HDT('NEW STORY', 'NUOVA STORIA'), () => ui('storyheroes'), 'primary', HDT('Begin the descent into Veyra', 'Inizia la discesa verso Veyra'), 'play', 1, HDT('THE JOURNEY', 'IL VIAGGIO')]);
  }
  buttons.push([HDT('JOURNAL', 'DIARIO'), () => hdOpenJournal('main'), '', HDT('Story, lore, people, bestiary, endings', 'Trama, lore, persone, bestiario, finali'), 'book', 0, HDT('THE JOURNEY', 'IL VIAGGIO')]);
  buttons.push([HDT('CLASSIC RUN', 'MODALITÀ CLASSICA'), () => { prev = 'main'; ui('classic'); }, '', HDT('The original roguelike', 'Il roguelike originale'), 'sword', 0, HDT('OTHER MODES', 'ALTRE MODALITÀ')]);
  buttons.push([HDT('MULTIPLAYER', 'MULTIGIOCATORE'), () => { prev = 'main'; NET.note = ''; ui('mp'); }, '', HDT('Online co-op for 1–4 players', 'Co-op online per 1–4 giocatori'), 'users', 0, HDT('OTHER MODES', 'ALTRE MODALITÀ')]);
  buttons.push([HDT('HOW TO PLAY', 'COME GIOCARE'), () => { prev = 'main'; ui('how'); }, '', HDT('Controls and survival tips', 'Comandi e consigli di sopravvivenza'), 'help', 0, HDT('INFORMATION', 'INFORMAZIONI')]);
  buttons.push([HDT('OPTIONS', 'OPZIONI'), () => { prev = 'main'; ui('opts'); }, '', HDT('Audio, gore and language', 'Audio, gore e lingua'), 'gear', 0, HDT('INFORMATION', 'INFORMAZIONI')]);
  buttons.push([HDT('CREDITS', 'CREDITI'), () => { prev = 'main'; ui('credits'); }, '', HDT('The people behind the lantern', 'Le persone dietro la lanterna'), 'star', 0, HDT('INFORMATION', 'INFORMAZIONI')]);
  buttons.push([HDT('CONTENT WARNING', 'AVVISO CONTENUTI'), () => { prev = 'main'; ui('disc'); }, '', HDT('Mature content and gore settings', 'Contenuti maturi e impostazioni gore'), 'warn', 0, HDT('INFORMATION', 'INFORMAZIONI')]);

  return {
    noLang: 1,
    custom: hdMainLayout(saved, completed, atCamp, ch, endName, buttons),
    btns: buttons
  };
};

/* ----------------------------- hero select ----------------------------- */
function hdLookLabel() { return HDT('APPEARANCE', 'ASPETTO') + ': ' + (sel.g === 'm' ? HDT('MALE', 'UOMO') : HDT('FEMALE', 'DONNA')); }
function hdLookToggle() { sel.g = sel.g === 'm' ? 'f' : 'm'; heroChanged(); }

SCR.storyheroes = () => {
  const c = CL[sel.i];
  return {
    title: HDT('CHOOSE YOUR LANTERN', 'SCEGLI LA TUA LANTERNA'),
    sub: HDT('THE STORY BEGINS AT ASHFALL', 'LA STORIA INIZIA AD ASHFALL'),
    row: 1,
    body: '<div class="tx dim" style="max-width:80cqw;margin-bottom:.3cqw">' + HDT('Five souls. One lantern. Each fights in their own way.', 'Cinque anime. Una lanterna. Ognuna combatte a modo suo.') + '</div>' +
      cardsHtml() + '<div class="tx ac">' + HDTR(c.info) + '</div>' +
      '<div class="tx dim">' + HDT('STARTS WITH', 'INIZIA CON') + ': ' + HDTR(WS[c.wp].n) + '</div>' +
      '<div class="storyMeta"><span>' + HDT('ONE HERO', 'UN EROE') + '</span><span>' + HDT('10 FLOORS', '10 PIANI') + '</span><span>' + HDT('YOUR NAME MATTERS', 'IL TUO NOME CONTA') + '</span></div>',
    btns: [
      [HDT('BEGIN THE STORY', 'INIZIA LA STORIA'), () => hdBeginStory(false), 'primary'],
      [hdLookLabel(), hdLookToggle],
      [HDT('BACK', 'INDIETRO'), () => ui('main')]
    ]
  };
};

SCR.confirmnew = () => ({
  title: HDT('BEGIN AGAIN?', 'RICOMINCIARE?'),
  body: '<div class="tx">' + HDT('A NEW STORY WILL OVERWRITE YOUR CURRENT DESCENT.', 'UNA NUOVA STORIA SOVRASCRIVERÀ LA TUA DISCESA ATTUALE.') +
    '<br><span class="dim">' + HDT('Your ending gallery is kept. The deep does not mind starting over.', 'La galleria dei finali viene conservata. Il profondo non teme di ricominciare.') + '</span></div>' +
    '<div class="storyTag">' + HDT('THE LANTERN REMEMBERS', 'LA LANTERNA RICORDA') + '</div>',
  btns: [
    [HDT('BEGIN AGAIN', 'RICOMINCIA'), () => ui('storyheroes'), 'primary'],
    [HDT('CANCEL', 'ANNULLA'), () => ui('main')]
  ]
});

/* -------------------------------- extras -------------------------------- */
SCR.extras = () => ({
  title: HDT('MORE', 'ALTRO'),
  body: '<div class="tx">' + HDT('EVERYTHING ELSE IN THE DEEP.', 'TUTTO IL RESTO NEL PROFONDO.') + '</div><div class="storyMeta"><span>' + HDT('STORY MODE', 'MODALITÀ STORIA') + '</span><span>' + HDT('CLASSIC', 'CLASSICA') + '</span><span>' + HDT('CO-OP', 'CO-OP') + '</span></div>',
  btns: [
    [HDT('MULTIPLAYER', 'MULTIGIOCATORE'), () => { prev = 'main'; NET.note = ''; ui('mp'); }],
    [HDT('HOW TO PLAY', 'COME GIOCARE'), () => { prev = 'extras'; ui('how'); }],
    [HDT('OPTIONS', 'OPZIONI'), () => { prev = 'extras'; ui('opts'); }],
    [HDT('CREDITS', 'CREDITI'), () => { prev = 'extras'; ui('credits'); }],
    [HDT('CONTENT WARNING', 'AVVISO CONTENUTI'), () => { prev = 'extras'; ui('disc'); }],
    [HDT('BACK', 'INDIETRO'), () => ui('main')]
  ]
});

SCR.classic = () => ({
  title: HDT('CLASSIC RUN', 'MODALITÀ CLASSICA'),
  sub: HDT('THE ORIGINAL ROGUELIKE', 'IL ROGUELIKE ORIGINALE'),
  row: 1,
  body: '<div class="tx">' + HDT('The original Hollowdeep: descend, loot, survive. No story, no camp — only the dungeon and what waits at the bottom.', 'Hollowdeep classico: scendi, saccheggia, sopravvivi. Nessuna storia, nessun accampamento: solo il dungeon e ciò che attende in fondo.') + '</div>' +
    '<div class="storyMeta"><span>' + HDT('10 FLOORS', '10 PIANI') + '</span><span>' + HDT('FINAL BOSS', 'BOSS FINALE') + '</span><span>' + HDT('ENDLESS MODE', 'MODALITÀ INFINITA') + '</span></div>',
  btns: [
    [HDT('NEW GAME', 'NUOVA PARTITA'), () => { prev = 'classic'; ui('heroes'); }, 'primary'],
    [HDT('MULTIPLAYER', 'MULTIGIOCATORE'), () => { prev = 'classic'; NET.note = ''; ui('mp'); }],
    [HDT('HOW TO PLAY', 'COME GIOCARE'), () => { prev = 'classic'; ui('how'); }],
    [HDT('OPTIONS', 'OPZIONI'), () => { prev = 'classic'; ui('opts'); }],
    [HDT('BACK TO STORY', 'TORNA ALLA STORIA'), () => ui('main')]
  ]
});

/* -------------------------------- camp -------------------------------- */
SCR.camp = () => {
  const ch = CHAPTERS[STORY.campChapter || STORY.chapter] || CHAPTERS[2];
  const npcs = hdCampNpcs();
  const npcHtml = npcs.map((n, i) =>
    '<button type="button" class="npc" data-npc="' + n.id + '"><span class="nn">' + (5 + i) + '. ' + HDTR(n.name) +
    '<br><span class="ns">' + HDTR(n.sub) + '</span></span><span class="uc">' + HDT('TALK', 'PARLA') + '</span></button>'
  ).join('');

  const upHtml = HD_UP_KEYS.map((k, i) => {
    const u = HD_UPGRADES[k];
    const lvl = STORY.upgrades[k] || 0;
    const maxed = lvl >= u.costs.length;
    const cost = maxed ? 0 : u.costs[lvl];
    const can = !maxed && (STORY.embers || 0) >= cost;
    const pips = u.costs.map((_, j) => '<i class="' + (j < lvl ? 'on' : '') + '"></i>').join('');
    return '<button type="button" class="up' + (maxed ? ' max' : can ? '' : ' no') + '" data-up="' + k + '">' +
      '<span><span class="un">' + (i + 1) + '. ' + HDTR(u.name) + '</span><div class="pips">' + pips + '</div>' +
      '<span class="ns">' + HDTR(u.desc) + '</span></span>' +
      '<span class="uc">' + (maxed ? HDT('MAX', 'MAX') : cost + ' ' + HDT('E', 'B')) + '</span></button>';
  }).join('');

  const head = '<div class="campHead"><span>' + HDT('CHAPTER', 'CAPITOLO') + ' <b>' + HD_ROMAN[STORY.campChapter || STORY.chapter] + '</b> — ' + HDTR(ch.name) + '</span>' +
    '<span>' + HDT('FLOOR', 'PIANO') + ' <b>' + (STORY.floor || ch.start) + '/10</b></span>' +
    '<span>' + HDT('EMBERS', 'BRACI') + ' <b>' + (STORY.embers || 0) + '</b></span>' +
    '<span>' + HDT('SHARDS', 'FRAMMENTI') + ' <b>' + (STORY.shards || 0) + '/3</b></span></div>';

  const msg = HD_CAMP_MSG ? '<div class="tx ac" style="font-size:max(10px,.78cqw)">' + HD_CAMP_MSG + '</div>' : '';

  return {
    title: HDT('THE LAST CAMP', 'L\'ULTIMO ACCAMPAMENTO'),
    body: '<div class="campArtWrap"><canvas id="campArt" width="352" height="84"></canvas></div>' + head +
      '<div class="campGrid">' +
        '<div class="campCol"><div class="campLbl">' + HDT('AT THE FIRE', 'AL FUOCO') + '</div>' + npcHtml + '</div>' +
        '<div class="campCol"><div class="campLbl">' + HDT('SPEND EMBERS', 'SPENDI BRACI') + '</div>' + upHtml + '</div>' +
      '</div>' + msg +
      '<div class="tx dim" style="font-size:max(9px,.7cqw)">' + HDT('1–4 SPEND EMBERS · 5–8 SPEAK · REST HEALS YOU BETWEEN CHAPTERS', '1–4 SPENDI BRACI · 5–8 PARLA · IL RIPOSO TI CURA TRA I CAPITOLI') + '</div>',
    row: 1,
    btns: [
      [HDT('DESCEND', 'SCENDI'), hdCampDescend, 'primary'],
      [HDT('JOURNAL', 'DIARIO'), () => hdOpenJournal('camp')],
      [HDT('OPTIONS', 'OPZIONI'), () => { prev = 'camp'; ui('opts'); }],
      [HDT('SAVE & QUIT', 'SALVA ED ESCI'), () => { hdSaveStory(); toMenu(); }]
    ]
  };
};

/* -------------------------------- journal -------------------------------- */
function hdJournalEntry(title, text, unlocked, lockedText) {
  return '<div class="jrEntry' + (unlocked ? '' : ' lock') + '"><b>' + (unlocked ? HDTR(title) : '???') + '</b><span>' + (unlocked ? HDTR(text) : HDTR(lockedText || 'NOT YET REMEMBERED.')) + '</span></div>';
}

SCR.journal = () => {
  const started = !!(STORY && STORY.started);
  const ch = CHAPTERS[STORY.chapter] || CHAPTERS[1];
  const loreCount = HD_LORE_ENTRIES.filter(e => STORY.lore && STORY.lore[e.id]).length;
  const peopleCount = HD_PEOPLE_ENTRIES.filter(e => STORY.people && STORY.people[e.id]).length;
  const bestCount = HD_BEST_ENTRIES.filter(e => STORY.bestiary && STORY.bestiary[e.id]).length;
  const echoCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(f => STORY.lore && STORY.lore['echo' + f]).length;

  let h = '<div class="jrn">';
  h += '<div class="jrIntro">' + (started ? (STORY.completed ? HDT('THE STORY IS FINISHED. THE LANTERN REMEMBERS.', 'LA STORIA È FINITA. LA LANTERNA RICORDA.') : HDT('CHAPTER', 'CAPITOLO') + ' ' + HD_ROMAN[STORY.chapter] + ' — ' + HDTR(ch.name)) : HDT('NO STORY HAS BEEN WRITTEN YET.', 'NESSUNA STORIA È ANCORA STATA SCRITTA.')) + '</div>';
  if (started) h += '<div class="storyMeta"><span>' + HDT('KILLS', 'UCCISIONI') + ' <b>' + (STORY.kills || 0) + '</b></span><span>' + HDT('DEATHS', 'MORTI') + ' <b>' + (STORY.deaths || 0) + '</b></span><span>' + HDT('ENDINGS', 'FINALI') + ' <b>' + hdEndingCount() + '/4</b></span><span>' + HDT('CYCLE', 'CICLO') + ' <b>' + (STORY.cycle || 1) + '</b></span></div>';

  h += '<h3>' + HDT('STORY SO FAR', 'LA STORIA FINORA') + '</h3>';
  if (started) {
    if (STORY.completed && HD_END_META[STORY.ending]) h += '<div class="jrEntry"><b>' + HDTR(HD_END_META[STORY.ending].n) + '</b><span>' + HDTR(HD_END_META[STORY.ending].d) + '</span></div>';
    else h += '<div class="jrEntry"><b>' + HDT('THE DESCENT', 'LA DISCESA') + '</b><span>' + HDTR(HD_STORY_SO_FAR[STORY.chapter] || '') + '</span></div>';
  } else {
    h += '<div class="jrEntry lock"><b>???</b><span>' + HDT('BEGIN A STORY TO FILL THESE PAGES.', 'INIZIA UNA STORIA PER RIEMPIRE QUESTE PAGINE.') + '</span></div>';
  }

  h += '<h3>' + HDT('THE DEEP — LORE', 'IL PROFONDO — LORE') + ' <span style="color:#8f84a8">(' + loreCount + '/' + HD_LORE_ENTRIES.length + ')</span></h3>';
  for (const e of HD_LORE_ENTRIES) h += hdJournalEntry(e.t, e.d, !!(STORY.lore && STORY.lore[e.id]));

  h += '<h3>' + HDT('PEOPLE', 'PERSONE') + ' <span style="color:#8f84a8">(' + peopleCount + '/' + HD_PEOPLE_ENTRIES.length + ')</span></h3>';
  for (const e of HD_PEOPLE_ENTRIES) h += hdJournalEntry(e.t + ' — ' + e.s, e.d, !!(STORY.people && STORY.people[e.id]));

  h += '<h3>' + HDT('BESTIARY', 'BESTIARIO') + ' <span style="color:#8f84a8">(' + bestCount + '/' + HD_BEST_ENTRIES.length + ')</span></h3>';
  for (const e of HD_BEST_ENTRIES) h += hdJournalEntry(e.t, e.d, !!(STORY.bestiary && STORY.bestiary[e.id]));

  h += '<h3>' + HDT('ECHOES OF VEYRA', 'ECOI DI VEYRA') + ' <span style="color:#8f84a8">(' + echoCount + '/10)</span></h3>';
  for (let f = 1; f <= 10; f++) {
    const on = !!(STORY.lore && STORY.lore['echo' + f]);
    h += hdJournalEntry('FLOOR ' + f + ' — ' + (HD_ECHO_TITLE[f] || 'AN ECHO'), HD_ECHO_TEXT[f] || '', on, 'AN ECHO STILL WAITS ON FLOOR ' + f + '.');
  }

  h += '<h3>' + HDT('MEMORY SHARDS', 'FRAMMENTI DI MEMORIA') + ' <span style="color:#8f84a8">(' + (STORY.shards || 0) + '/3)</span></h3>';
  const shardInfo = [
    ['puzzle', 'THE SEALED MEMORY', 'A city counting its dead behind a rune-seal. Found on floor 2.'],
    ['arena', 'HOLD THE LIGHT', 'The last procession of Veyra, still walking. Found on floor 5.'],
    ['chase', 'THE COLLAPSE', 'The night the roof came down, remembered by the ceiling. Found on floor 8.']
  ];
  for (const s of shardInfo) {
    const on = !!STORY.done['shard_' + s[0]];
    h += '<div class="jrEntry' + (on ? '' : ' lock') + '"><b class="jrShard">' + (on ? s[1] : '???') + '</b><span>' + (on ? s[2] : 'A MEMORY SHARD IS STILL BURIED SOMEWHERE BELOW.') + '</span></div>';
  }

  h += '<h3>' + HDT('ENDINGS', 'FINALI') + ' <span style="color:#8f84a8">(' + hdEndingCount() + '/4)</span></h3><div class="endRow">';
  for (const e of HD_END_ENTRIES) h += '<span class="endChip' + (STORY.endings && STORY.endings[e.id] ? ' got' : '') + '">' + (STORY.endings && STORY.endings[e.id] ? HDTR(e.t) : '???') + '</span>';
  h += '</div>';
  for (const e of HD_END_ENTRIES) h += hdJournalEntry(e.t, HD_END_META[e.id] ? HD_END_META[e.id].d : '', !!(STORY.endings && STORY.endings[e.id]), e.d);

  h += '<h3>' + HDT('RECORD', 'RECORD') + '</h3>';
  h += '<div class="jrEntry"><b>' + HDT('THE LANTERN\'S ACCOUNT', 'IL CONTO DELLA LANTERNA') + '</b><span>' + HDT('CYCLE', 'CICLO') + ' ' + (STORY.cycle || 1) +
    ' · ' + HDT('KILLS', 'UCCISIONI') + ' ' + (STORY.kills || 0) +
    ' · ' + HDT('DEATHS', 'MORTI') + ' ' + (STORY.deaths || 0) +
    ' · ' + HDT('EMBERS', 'BRACI') + ' ' + (STORY.embers || 0) +
    ' · ' + HDT('SHARDS', 'FRAMMENTI') + ' ' + (STORY.shards || 0) + '/3' +
    ' · ' + HDT('ENDINGS', 'FINALI') + ' ' + hdEndingCount() + '/4</span></div>';
  h += '</div>';

  return {
    title: HDT('JOURNAL', 'DIARIO'),
    body: h,
    btns: [[HDT('BACK', 'INDIETRO'), () => {
      const b = HD_JOURNAL_BACK;
      if (b === 'over') ui('over');
      else if (b === 'epilogue') ui('epilogue');
      else if (b === 'camp') ui('camp');
      else if (b === 'pause') ui('pause');
      else ui('main');
    }]]
  };
};

/* -------------------------------- epilogue -------------------------------- */
SCR.epilogue = () => {
  const end = STORY.ending || 'ashes';
  const m = HD_END_META[end] || HD_END_META.ashes;
  const chips = HD_END_ENTRIES.map(e => '<span class="endChip' + (STORY.endings && STORY.endings[e.id] ? ' got' : '') + '">' + (STORY.endings && STORY.endings[e.id] ? HDTR(e.t) : '???') + '</span>').join('');
  const stats = '<div class="epiStats">' +
    '<b>' + HDT('ENDING', 'FINALE') + '</b><span>' + HDTR(m.n) + '</span>' +
    '<b>' + HDT('CYCLE', 'CICLO') + '</b><span>' + (STORY.cycle || 1) + '</span>' +
    '<b>' + HDT('ENEMIES SLAIN', 'NEMICI UCCISI') + '</b><span>' + (STORY.kills || 0) + '</span>' +
    '<b>' + HDT('DEATHS', 'MORTI') + '</b><span>' + (STORY.deaths || 0) + '</span>' +
    '<b>' + HDT('MEMORY SHARDS', 'FRAMMENTI DI MEMORIA') + '</b><span>' + (STORY.shards || 0) + '/3</span>' +
    '<b>' + HDT('EMBERS CARRIED', 'BRACI PORTATE') + '</b><span>' + (STORY.embers || 0) + '</span>' +
    '<b>' + HDT('ENDINGS FOUND', 'FINALI TROVATI') + '</b><span>' + hdEndingCount() + '/4</span>' +
    '<b>' + HDT('THE LANTERN', 'LA LANTERNA') + '</b><span>' + HDT(end === 'dawn' ? 'RETURNED' : end === 'forgotten' ? 'EMPTY' : end === 'crown' ? 'WORN' : 'BROKEN', end === 'dawn' ? 'RESTITUITA' : end === 'forgotten' ? 'VUOTA' : end === 'crown' ? 'INDOSSATA' : 'SPEZZATA') + '</span></div>';

  return {
    title: '',
    body: '<div class="epiHero">' + HDTR(m.n) + '</div><div class="epiSub">' + HDTR(m.sub) + '</div>' +
      '<div class="campArtWrap"><canvas id="epiArt" width="352" height="84"></canvas></div>' +
      '<div class="tx">' + HDTR(m.d) + '</div>' + stats +
      '<div class="endRow">' + chips + '</div>' +
      '<div class="tx dim">' + HDT('THE DEEP IS QUIET. FOR NOW.', 'IL PROFONDO È QUIETO. PER ORA.') + '</div>',
    btns: [
      [HDT('NEW CYCLE', 'NUOVO CICLO'), hdNewCycle, 'primary'],
      [HDT('JOURNAL', 'DIARIO'), () => hdOpenJournal('epilogue')],
      [HDT('MAIN MENU', 'MENU PRINCIPALE'), () => toMenu()]
    ]
  };
};

/* -------------------------------- death / pause -------------------------------- */
SCR.over = () => {
  if (!(STORY && STORY.active && G && G.story)) return HD_SCR_OVER();
  const f = G.floor || STORY.floor || 1;
  const ch = CHAPTERS[hdChapterForFloor(f)] || CHAPTERS[1];
  return {
    title: HDT('THE LANTERN GUTTERS', 'LA LANTERNA VACILLA'),
    body: '<div class="tx">' + HDT('YOU FELL ON FLOOR', 'SEI CADUTO AL PIANO') + ' ' + f + '/10<br><span class="dim">' + HDT('CHAPTER', 'CAPITOLO') + ' ' + HD_ROMAN[hdChapterForFloor(f)] + ' — ' + HDTR(ch.name) + '</span></div>' +
      '<div class="storyMeta"><span>' + HDT('DEATHS', 'MORTI') + ' <b>' + (STORY.deaths || 0) + '</b></span><span>' + HDT('SHARDS', 'FRAMMENTI') + ' <b>' + (STORY.shards || 0) + '/3</b></span><span>' + HDT('EMBERS', 'BRACI') + ' <b>' + (STORY.embers || 0) + '</b></span></div>' +
      '<div class="tx ac">' + HDT('YOU WILL RISE AT THE START OF FLOOR', 'RISORGERAI ALL\'INIZIO DEL PIANO') + ' ' + (STORY.checkpoint ? STORY.checkpoint.floor : f) + '.</div>' +
      '<div class="tx dim">' + HDT('The deep keeps what it catches. The lantern does not.', 'Il profondo conserva ciò che cattura. La lanterna no.') + '</div>',
    btns: [
      [HDT('RISE AGAIN', 'RISORGI'), hdRetryFloor, 'primary'],
      [HDT('JOURNAL', 'DIARIO'), () => hdOpenJournal('over')],
      [HDT('MAIN MENU', 'MENU PRINCIPALE'), () => toMenu()]
    ]
  };
};

SCR.pause = () => {
  if (!(STORY && STORY.active && G && G.story)) return HD_SCR_PAUSE();
  return {
    title: HDT('PAUSED', 'IN PAUSA'),
    body: hdStoryMeta() + '<div class="tx dim">' + HDT('THE DEEP DOES NOT PAUSE. IT ONLY WAITS.', 'IL PROFONDO NON SI FERMA. ASPETTA E BASTA.') + '</div>',
    btns: [
      [HDT('RESUME', 'RIPRENDI'), resume, 'primary'],
      [HDT('JOURNAL', 'DIARIO'), () => hdOpenJournal('pause')],
      [HDT('OPTIONS', 'OPZIONI'), () => { prev = 'pause'; ui('opts'); }],
      [HDT('SAVE & QUIT', 'SALVA ED ESCI'), () => { hdSaveStory(); toMenu(); }]
    ]
  };
};

/* -------------------------------- wiring -------------------------------- */
const _hdHeroChanged = heroChanged;
heroChanged = function () {
  if (scr === 'storyheroes') {
    if (mode === 'menu') previewScene();
    ui('storyheroes', 1);
    return;
  }
  _hdHeroChanged();
};

/* camp clicks */
ov.addEventListener('click', e => {
  if (scr !== 'camp') return;
  const npc = e.target.closest && e.target.closest('[data-npc]');
  if (npc) {
    e.stopPropagation();
    hdCampTalk(npc.dataset.npc);
    return;
  }
  const up = e.target.closest && e.target.closest('[data-up]');
  if (up) {
    e.stopPropagation();
    hdBuyUpgrade(up.dataset.up);
  }
});

/* camp and hero-select hotkeys */
addEventListener('keydown', e => {
  if (CINE.active || inputOn()) return;
  const k = (e.key || '').toLowerCase();
  if (scr === 'storyheroes') {
    if (k === 'arrowleft' || k === 'a') {
      sel.i = (sel.i + CL.length - 1) % CL.length;
      e.preventDefault(); e.stopImmediatePropagation();
      heroChanged();
    } else if (k === 'arrowright' || k === 'd') {
      sel.i = (sel.i + 1) % CL.length;
      e.preventDefault(); e.stopImmediatePropagation();
      heroChanged();
    } else if (k === 'g') {
      e.preventDefault(); e.stopImmediatePropagation();
      lookToggle();
    }
    return;
  }
  if (scr === 'camp') {
    if (k >= '1' && k <= '4') {
      e.preventDefault(); e.stopImmediatePropagation();
      hdBuyUpgrade(HD_UP_KEYS[+k - 1]);
    } else if (k >= '5' && k <= '8') {
      const list = hdCampNpcs();
      const n = list[+k - 5];
      if (n) {
        e.preventDefault(); e.stopImmediatePropagation();
        hdCampTalk(n.id);
      }
    }
    return;
  }
  if (scr === 'journal') {
    const box = ov.querySelector('.jrn');
    if (!box) return;
    if (k === 'arrowdown' || k === 's' || k === ' ') {
      e.preventDefault(); e.stopImmediatePropagation();
      box.scrollTop += 36;
    } else if (k === 'arrowup' || k === 'w') {
      e.preventDefault(); e.stopImmediatePropagation();
      box.scrollTop -= 36;
    } else if (k === 'escape') {
      e.preventDefault(); e.stopImmediatePropagation();
      const b = HD_JOURNAL_BACK;
      if (b === 'over') ui('over');
      else if (b === 'epilogue') ui('epilogue');
      else if (b === 'camp') ui('camp');
      else if (b === 'pause') ui('pause');
      else ui('main');
    }
  }
}, true);

/* how-to-play pulse entry */
try {
  HOW.push(['pulse', 'LANTERN PULSE', kc('Q') + '<br>Burn the dark back. Damages nearby enemies.<br>Pushes the collapse away.']);
} catch (e) {}

const _hdDemo = demo;
demo = function (c) {
  if (!c || c.dataset.d !== 'pulse') { _hdDemo(c); return; }
  const g = c.getContext('2d'), t = now;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, 64, 40);
  g.fillStyle = '#1d1628'; g.fillRect(0, 0, 64, 40);
  g.fillStyle = '#2b2238'; for (let i = 0; i < 8; i++) g.fillRect(i * 8 + (i & 1 ? 4 : 0), 30, 4, 1);
  g.fillStyle = '#120d1a'; g.fillRect(0, 34, 64, 6);
  const a = A[hdHeroKey() + '_idle_anim_f' + (Math.floor(t * 6) % 4)];
  if (a && img.complete) g.drawImage(img, a[0], a[1], a[2], a[3], 6, 8, a[2], a[3]);
  const ph = (t % 1.2) / 1.2;
  const r = 4 + ph * 26;
  g.globalAlpha = Math.max(0, 1 - ph);
  g.strokeStyle = '#9fd3ff'; g.lineWidth = 2;
  g.beginPath(); g.arc(14, 22, r, 0, 6.283); g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = '#9fd3ff';
  g.beginPath(); g.arc(14, 20, 2, 0, 6.283); g.fill();
  g.fillStyle = '#ffd98a'; g.font = "6px 'Press Start 2P',monospace"; g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText('Q', 2, 2);
};
