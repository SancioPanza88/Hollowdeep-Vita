/* ===== story_scenes.js ===== */
/* =====================================================================
   THE LANTERN BELOW — narrative scenes
   ===================================================================== */

const SCENES = {};

/* ------------------------------- PROLOGUE ------------------------------- */
SCENES.intro = {
  bg: 'village', fx: 'ash',
  actors: [
    { k: 'hero', x: 128, y: 202, sc: 2.2, ph: 1 },
    { k: 'mara', x: 186, y: 190, sc: 1.5 }
  ],
  lines: [
    HD_CAP('HOLLOWDEEP', 'THE LANTERN BELOW', 3.4, 'A STORY OF MEMORY AND ASH'),
    HD_L('NARRATOR', 'Ashfall has not seen a dawn in eleven days.'),
    HD_L('NARRATOR', 'The lanterns went out one by one. Last night, the last one began to die.'),
    { bg: 'village', fx: 'ash', actors: [{ k: 'hero', x: 120, y: 204, sc: 2.2 }, { k: 'mara', x: 196, y: 186, sc: 1.6, glow: '#9fd3ff' }] },
    HD_L('MARA', 'You came. I was beginning to think the dark had eaten your name too.'),
    HD_L('YOU', 'Are you... the light?'),
    HD_L('MARA', 'A memory of one. My name is Mara. I have waited a long time for someone who still remembers how to carry a flame.'),
    HD_CH(
      HD_OPT('For the village.', { set: { motive: 'village' }, trust: 0 }),
      HD_OPT('For my sister. The Hollow took her.', { set: { motive: 'sister' } }),
      HD_OPT('For the truth.', { set: { motive: 'truth' } })
    ),
    { if: () => STORY.flags.motive === 'village', who: 'MARA', text: 'Then we will bring them a dawn, or we will die trying.' },
    { if: () => STORY.flags.motive === 'sister', who: 'MARA', text: 'Ah. The one it took. I will help you remember her. That is what the lantern is for.' },
    { if: () => STORY.flags.motive === 'truth', who: 'MARA', text: 'Truth is a blade with two edges. Carry it carefully.' },
    HD_L('MARA', 'Below us is Veyra. A city that drowned in a single night. Its memories are still down there, rotting.'),
    HD_L('MARA', 'The Hollow eats memory. It has already eaten the names of everyone in your village. Except yours. Except mine.'),
    HD_CH(
      HD_OPT('I trust you, Mara.', { set: { maraTrust: true }, trust: 1 }),
      HD_OPT('I trust no one.', { set: { maraTrust: false }, trust: -1 })
    ),
    { if: () => (STORY.flags.trust || 0) >= 1, who: 'MARA', text: 'Good. Then we will be afraid together.' },
    { if: () => (STORY.flags.trust || 0) < 1, who: 'MARA', text: 'Wise. Keep the lantern between us, then. Light is a poor thing to trust blindly.' },
    HD_L('MARA', 'There is a king at the bottom. The first Lamplighter. He has worn the Hollow like a crown for three hundred years.'),
    HD_L('MARA', 'End him, and the Hollow ends. That is the whole of it.'),
    HD_L('YOU', 'And if he does not want to end?'),
    HD_L('MARA', '...Then you will have to decide what he is.'),
    HD_CAP('CHAPTER I', 'WHAT THE MUD KEEPS', 3.6, 'THE DESCENT')
  ]
};

/* ------------------------------ CHAPTER II ------------------------------ */
SCENES.ch2_intro = {
  bg: 'depths', fx: 'spores',
  actors: [
    { k: 'hero', x: 120, y: 204, sc: 2.2 },
    { k: 'mara', x: 176, y: 190, sc: 1.5 }
  ],
  lines: [
    HD_CAP('CHAPTER II', 'THE ROTTING SAINT', 3.4, 'THE GARDEN DISTRICT'),
    HD_L('MARA', 'This was the Garden District. The water brought rot, and the rot brought flowers.'),
    HD_L('NARRATOR', 'Something is writing in the silt ahead. It has been writing for a long time.'),
    HD_L('MARA', 'The Gravekeeper spoke of a scholar. If anyone is still keeping notes down here, it will be him.'),
    HD_L('YOU', 'Notes? In this place?'),
    HD_L('MARA', 'Memory is a kind of writing. The Hollow is a kind of erasing. Perhaps he thought he could outwrite it.'),
    HD_L('MARA', 'Stay close. The flowers are listening.')
  ]
};

/* ------------------------------ CHAPTER III ------------------------------ */
SCENES.ch3_intro = {
  bg: 'hall', fx: 'embers',
  actors: [
    { k: 'hero', x: 110, y: 204, sc: 2.2 },
    { k: 'mara', x: 158, y: 190, sc: 1.4 }
  ],
  lines: [
    HD_CAP('CHAPTER III', 'THE EMBER CROWN', 3.4, 'THE FORGE OF VEYRA'),
    HD_L('NARRATOR', 'The Ember Halls. Every flame here is a memory burning down to its last thought.'),
    { if: () => hdFlag('orin'), who: 'ORIN', text: 'Aurel forged the crown in this hall. His sister lit the furnace. The records are... somewhat singed.' },
    { if: () => hdFlag('orin'), text: 'He was not trying to become a god. He was trying to build a vessel large enough to hold a city.' },
    HD_L('MARA', 'The furnace is still warm. That means something down here is still remembering.'),
    { actors: [{ k: 'hero', x: 110, y: 204, sc: 2.2 }, { k: 'mara', x: 158, y: 190, sc: 1.4 }, { k: 'witch', x: 248, y: 198, sc: 1.9 }] },
    HD_L('EMBER WITCH', 'Warm? It is furious. There is a difference, little candle.'),
    HD_L('EMBER WITCH', 'You smell of the surface. Of rain. Of people who still believe the sun is a promise.'),
    HD_L('MARA', 'We are here for the crown.'),
    HD_L('EMBER WITCH', 'Everyone is. The crown is downstairs, wearing a king. Take a brand before you go. It will keep the dark from taking you.'),
    HD_L('YOU', 'And the price?'),
    HD_L('EMBER WITCH', 'The crown will know its own. That is all. That is everything.'),
    HD_L('MARA', 'Do not listen to her.'),
    HD_L('EMBER WITCH', 'She would say that. She is a candle that has already burned down to the wick.'),
    HD_L('MARA', '...'),
    HD_CAP('THE EMBER CROWN', 'THE LAST LIGHT IS BELOW', 3.2, 'CHAPTER III')
  ]
};

/* --------------------------- EVENT: THE DOOR --------------------------- */
SCENES.ev_whisper = {
  bg: 'door', fx: 'dust',
  actors: [{ k: 'hero', x: 120, y: 212, sc: 2 }, { k: 'mara', x: 232, y: 196, sc: 1.4 }],
  lines: [
    HD_CAP('THE WHISPERING DOOR', 'A MEMORY THAT REFUSES TO CLOSE', 2.6, 'SECRET'),
    HD_L('NARRATOR', 'A door stands in the mud where no door should be. Its wood is a hundred mouths, all closed.'),
    HD_L('MARA', 'Do not touch it. It remembers names. It will use yours.'),
    HD_L('THE DOOR', '...Aurel...'),
    HD_L('YOU', 'It said a name.'),
    HD_L('MARA', 'An old one. Listen, and it will cost you. Seal it, and it will cost you something else.'),
    HD_CH(
      HD_OPT('Listen to the door.', { hint: '-1 heart, +25 embers, a memory', do: () => { hdSetFlag('heardDoor'); hdLore('mouths'); hdHurtHero(2); hdEmbers(25); } }),
      HD_OPT('Seal it with your lantern.', { hint: '+1 max heart', do: () => { hdSetFlag('sealedDoor'); hdPeople('door'); } }),
      HD_OPT('Walk away.', { hint: 'Some doors should stay shut.' })
    ),
    { if: () => hdFlag('heardDoor'), who: 'NARRATOR', text: 'The mouths open. You see white towers and a red sun. A woman in a lamplighter coat is laughing. Then the water comes.' },
    { if: () => hdFlag('heardDoor'), who: 'MARA', text: 'You heard the city. Did it say his name again?' },
    { if: () => hdFlag('heardDoor'), who: 'YOU', text: 'Aurel. Who is Aurel?' },
    { if: () => hdFlag('heardDoor'), who: 'MARA', text: 'Someone I failed to save. Leave it.' },
    { if: () => hdFlag('sealedDoor'), who: 'NARRATOR', text: 'You press the lantern to the wood. The mouths close one by one, sighing like wet leaves. Something warm stays in your chest.' },
    { if: () => hdFlag('sealedDoor'), who: 'MARA', text: 'You did not listen. That was kind. Kindness is not always wisdom, but it is rarer.' },
    { if: () => !hdFlag('heardDoor') && !hdFlag('sealedDoor'), who: 'MARA', text: 'Good. Some doors are better left as doors.' },
    HD_L('NARRATOR', 'Behind you, the mud closes over the threshold. The deep goes on.')
  ]
};

/* --------------------------- EVENT: ORIN --------------------------- */
SCENES.ev_orin = {
  bg: 'resin', fx: 'dust',
  actors: [{ k: 'hero', x: 126, y: 212, sc: 2 }, { k: 'mara', x: 234, y: 196, sc: 1.4 }],
  lines: [
    HD_CAP('THE RESIN SCHOLAR', 'A MAN SUSPENDED IN AMBER', 2.6, 'THE GARDEN'),
    HD_L('NARRATOR', 'A man hangs inside a cocoon of amber, pen still moving.'),
    HD_L('ORIN', 'Ah. A living one. Splendid. Could you - carefully - not touch the resin with your bare hands?'),
    HD_L('MARA', 'He has been here since before the flood. The rot keeps him alive. It may also be the only thing holding him together.'),
    HD_L('ORIN', 'Orin. Cartographer, archivist, reluctant immortal. I have mapped every vein of the Hollow. I can help you, if you help me.'),
    HD_L('ORIN', 'But the resin is also food for the rot. Break it, and I will need something of yours to keep standing.'),
    HD_CH(
      HD_OPT('Free him. (-1 heart)', { hint: 'Orin joins you. He knows the way.', do: () => { hdSetFlag('orin'); hdPeople('orin'); hdLore('orin'); hdLore('veyra'); hdHurtHero(2); hdAddTrust(1); } }),
      HD_OPT('Take the relic in his hands.', { hint: '+1 damage. The amber dims.', do: () => { hdSetFlag('orinDead'); hdPeople('orin'); hdLore('orin'); hdPermanentDmg(1); hdAddTrust(-1); } }),
      HD_OPT('Ask what he knows.', { hint: 'Lore, +10 embers. Leave him.', do: () => { hdLore('orin'); hdLore('hollow'); hdEmbers(10); } })
    ),
    { if: () => hdFlag('orin'), who: 'NARRATOR', text: 'You crack the amber with the butt of your weapon. Orin falls into your arms, cold and laughing. The cocoon takes a little of your warmth as payment.' },
    { if: () => hdFlag('orin'), who: 'ORIN', text: 'Oh, that is much better. I have not seen my own hands in thirty years. They are still holding a pen. Good.' },
    { if: () => hdFlag('orin'), who: 'ORIN', text: 'The crown is not a crown. It is a contract, written in names. Aurel signed it in his own blood.' },
    { if: () => hdFlag('orinDead'), who: 'NARRATOR', text: 'You prise the relic from his fingers. It is a small brass compass with no needle. The amber dims. His pen stops.' },
    { if: () => hdFlag('orinDead'), who: 'MARA', text: 'You could have saved him.' },
    { if: () => hdFlag('orinDead'), who: 'YOU', text: 'I saved us.' },
    { if: () => hdFlag('orinDead'), who: 'MARA', text: '...Yes. That is what I am afraid of.' },
    { if: () => !hdFlag('orin') && !hdFlag('orinDead'), who: 'ORIN', text: 'The Hollow is not a monster. It is a hunger that was once a promise. The king is the promise. The hunger is the price. Go carefully.' },
    { if: () => !hdFlag('orin') && !hdFlag('orinDead'), who: 'MARA', text: 'He will still be here when we come back. If there is a back.' },
    HD_L('NARRATOR', 'Behind the cocoon, something green and patient turns toward the sound of your breathing.')
  ]
};

/* --------------------------- EVENT: EMBER WITCH --------------------------- */
SCENES.ev_witch = {
  bg: 'forge', fx: 'embers',
  actors: [{ k: 'hero', x: 120, y: 212, sc: 2 }, { k: 'mara', x: 174, y: 198, sc: 1.35 }, { k: 'witch', x: 260, y: 200, sc: 1.9 }],
  lines: [
    HD_CAP('THE EMBER WITCH', 'A BRAND FOR THE DARK', 2.6, 'THE FORGE'),
    HD_L('EMBER WITCH', 'Back so soon? You have the look of someone who has been arguing with a candle.'),
    HD_L('MARA', 'Do not call me that.'),
    HD_L('EMBER WITCH', 'I will call you what you are. A flame that remembers being a woman.'),
    HD_L('EMBER WITCH', 'Now. The offer. One mark, and the Hollow will never take you. The dark will look at you and see its own reflection.'),
    HD_L('YOU', 'What happens to me?'),
    HD_L('EMBER WITCH', 'You become difficult to forget. Also difficult to love. A fair trade, most days.'),
    HD_L('MARA', 'She is not lying. She is not telling the whole truth either.'),
    { label: 'offer' },
    HD_CH(
      HD_OPT('Take the Ember Brand.', { hint: '+1 heart, +1 damage. The Dawn will close.', do: () => { hdSetFlag('branded'); hdLore('crown'); hdAddTrust(-1); hdPermanentHp(1); hdPermanentDmg(1); }, jump: 'doneOffer' }),
      HD_OPT('Refuse.', { hint: '+20 embers. Keep your name.', do: () => { hdAddTrust(1); hdEmbers(20); hdLore('crown'); }, jump: 'doneOffer' }),
      HD_OPT('Ask what the crown is.', { hint: 'Lore.', do: () => { hdLore('crown'); hdLore('aurel'); }, jump: 'afterAsk' })
    ),
    { label: 'afterAsk' },
    HD_L('EMBER WITCH', 'The crown is a vessel. Aurel poured a city into it. A city is heavy. A city is loud. After three hundred years, he is less a king than a lid.'),
    HD_L('MARA', 'Then help us open it.'),
    HD_L('EMBER WITCH', 'I am helping. I am offering you a handle.'),
    HD_CH(
      HD_OPT('Take the Ember Brand.', { hint: '+1 heart, +1 damage. The Dawn will close.', do: () => { hdSetFlag('branded'); hdAddTrust(-1); hdPermanentHp(1); hdPermanentDmg(1); }, jump: 'doneOffer' }),
      HD_OPT('Refuse.', { hint: '+20 embers. Keep your name.', do: () => { hdAddTrust(1); hdEmbers(20); }, jump: 'doneOffer' })
    ),
    { label: 'doneOffer' },
    { if: () => hdFlag('branded'), who: 'NARRATOR', text: 'The brand sinks into your wrist. It does not hurt. It remembers hurting, somewhere far away, and lends you the memory.' },
    { if: () => hdFlag('branded'), who: 'MARA', text: 'You let it mark you. Now it can find you.' },
    { if: () => hdFlag('branded'), who: 'YOU', text: 'Then it will find me standing.' },
    { if: () => !hdFlag('branded'), who: 'MARA', text: 'You kept your name.' },
    { if: () => !hdFlag('branded'), who: 'EMBER WITCH', text: 'For now. Names are heavy things. You will tire.' },
    HD_L('NARRATOR', 'The forge breathes. Somewhere below, a crown turns toward you, curious.')
  ]
};

/* --------------------------- EVENT: MIRROR --------------------------- */
SCENES.ev_mirror = {
  bg: 'mirror', fx: 'dust',
  actors: [{ k: 'hero', x: 124, y: 212, sc: 2 }, { k: 'mara', x: 232, y: 198, sc: 1.4 }],
  lines: [
    HD_CAP('THE MIRROR OF VEYRA', 'THE NIGHT THE CITY DROWNED', 2.8, 'THE HALL OF NAMES'),
    HD_L('NARRATOR', 'A mirror stands upright in the ash. It does not show you.'),
    HD_L('MARA', 'It shows the last night. I have never dared.'),
    HD_L('YOU', 'You were there.'),
    HD_L('MARA', 'I was the one who lit the lamps while the water came. My brother went into the dark to hold the city. I have been holding the light ever since.'),
    HD_CH(
      HD_OPT('Touch the mirror.', { hint: 'Learn the truth. This will matter.', do: () => { hdSetFlag('sawTruth'); hdLore('aurel'); hdLore('mara'); hdPeople('mara'); hdAddTrust(1); } }),
      HD_OPT('Shatter it.', { hint: '+1 max heart. Mara will remember alone.', do: () => { hdSetFlag('shatteredMirror'); hdPermanentHp(1); hdAddTrust(-1); } }),
      HD_OPT('Leave it.', { hint: 'Some mirrors are doors.' })
    ),
    { if: () => hdFlag('sawTruth'), who: 'NARRATOR', text: 'A man in a lamplighter coat stands in a drowning street. A woman with a lantern shouts his name.' },
    { if: () => hdFlag('sawTruth'), who: 'AUREL', text: 'Mara! Take the light! I can hold the rest!' },
    { if: () => hdFlag('sawTruth'), who: 'NARRATOR', text: 'He opens his chest. The city pours in. The crown is not forged. It grows.' },
    { if: () => hdFlag('sawTruth'), who: 'MARA', text: '...He said he could hold it.' },
    { if: () => hdFlag('sawTruth'), who: 'YOU', text: 'He did.' },
    { if: () => hdFlag('sawTruth'), who: 'MARA', text: 'Then why is he still holding it?' },
    { if: () => hdFlag('shatteredMirror'), who: 'NARRATOR', text: 'The mirror breaks into a hundred drowned rooms. Something in your chest grows harder, and heavier, and will not break.' },
    { if: () => hdFlag('shatteredMirror'), who: 'MARA', text: 'You did not have to see it. I did.' },
    { if: () => hdFlag('shatteredMirror'), who: 'YOU', text: 'I know.' },
    { if: () => !hdFlag('sawTruth') && !hdFlag('shatteredMirror'), who: 'MARA', text: 'Then we go on without it. We have enough ghosts.' },
    HD_L('NARRATOR', 'Far below, the throne is waiting.')
  ]
};

/* --------------------------- BOSS: GRAVEKEEPER --------------------------- */
SCENES.boss_gravekeeper = {
  bg: 'crypt', fx: 'fog',
  actors: [
    { k: 'hero', x: 118, y: 204, sc: 2.2 },
    { k: 'mara', x: 166, y: 190, sc: 1.4 },
    { k: 'gk', x: 258, y: 198, sc: 1.7 }
  ],
  lines: [
    { actors: [{ k: 'hero', x: 118, y: 204, sc: 2.2 }, { k: 'mara', x: 166, y: 190, sc: 1.4 }, { k: 'gk', x: 258, y: 198, sc: 1.7 }] },
    HD_L('GRAVEKEEPER', 'Turn back. The graves are full.'),
    HD_L('MARA', 'He has been guarding empty graves since the flood. He does not know he is dead.'),
    HD_L('YOU', 'I am not here to rob them.'),
    HD_L('GRAVEKEEPER', 'Then why do you carry a light? Light wakes them.'),
    HD_CH(
      HD_OPT('Show him the lantern.', { hint: 'The Gravekeeper weakens.', do: () => { hdSetFlag('gkShown'); HD_BOSS_MOD = { hp: .8 }; } }),
      HD_OPT('Say the name from the door.', { hint: 'Requires: The Whispering Door', locked: () => !hdFlag('heardDoor'), lockHint: 'You have not heard the name.', do: () => { HD_BOSS_MOD = { hp: .65 }; hdSetFlag('gkNamed'); hdAddTrust(1); hdLore('gk'); } }),
      HD_OPT('Draw your weapon.', { hint: 'A clean death.', do: () => { HD_BOSS_MOD = null; } })
    ),
    { if: () => hdFlag('heardDoor'), who: 'YOU', text: 'Aurel. Was that your name?' },
    { if: () => !hdFlag('heardDoor'), who: 'YOU', text: 'I carry it so I can find my way back.' },
    HD_L('GRAVEKEEPER', '...I remember a name. Was it mine?'),
    HD_L('MARA', 'Give him peace.'),
    HD_L('GRAVEKEEPER', 'Peace. Yes. I had a word for that once. It was smaller than this.'),
    HD_CAP('THE GRAVEKEEPER', 'KEEPER OF EMPTY GRAVES', 2.6, 'BOSS')
  ]
};

SCENES.ch1_outro = {
  bg: 'crypt', fx: 'fog',
  actors: [
    { k: 'hero', x: 120, y: 204, sc: 2.1 },
    { k: 'mara', x: 168, y: 190, sc: 1.4 },
    { k: 'gk', x: 254, y: 198, sc: 1.2, a: .45 }
  ],
  lines: [
    HD_L('NARRATOR', 'The Gravekeeper sinks to his knees. The light in his chest is going out.'),
    HD_L('GRAVEKEEPER', 'Do you... remember me?'),
    HD_L('MARA', 'Answer him. Names are the only thing the Hollow cannot digest.'),
    HD_CH(
      HD_OPT('I will remember you.', { hint: 'He will follow you to the fire.', do: () => { hdSetFlag('sparedGK'); hdPeople('gravekeeper'); hdLore('gk'); hdEmbers(30); hdAddTrust(1); } }),
      HD_OPT('Rest. I will carry the rest.', { hint: 'He will follow you to the fire.', do: () => { hdSetFlag('sparedGK'); hdPeople('gravekeeper'); hdLore('gk'); hdEmbers(30); hdAddTrust(1); } }),
      HD_OPT('No. The dead should forget.', { hint: '+1 damage, +40 embers.', do: () => { hdSetFlag('killedGK'); hdLore('gk'); hdPermanentDmg(1); hdEmbers(40); hdAddTrust(-1); } })
    ),
    { if: () => hdFlag('sparedGK'), who: 'NARRATOR', text: 'He shrinks. The grave-iron falls away. What remains is small and grey and breathing, and it follows you to the fire.' },
    { if: () => hdFlag('sparedGK'), who: 'GRAVEKEEPER', text: 'I had a name. You gave it back. I will keep it safe.' },
    { if: () => hdFlag('sparedGK'), who: 'MARA', text: 'You gave him a name. Names are the only thing the Hollow cannot digest.' },
    { if: () => hdFlag('killedGK'), who: 'NARRATOR', text: 'You close his eyes. The grave-iron is warm in your hand. It fits better than it should.' },
    { if: () => hdFlag('killedGK'), who: 'MARA', text: 'He asked you to remember him.' },
    { if: () => hdFlag('killedGK'), who: 'YOU', text: 'I remember. That is enough.' },
    { if: () => hdFlag('killedGK'), who: 'MARA', text: '...Yes. That is what I am afraid of.' },
    HD_L('MARA', 'The stairs go up, not down. The camp is above the waterline. We should rest.'),
    HD_L('MARA', 'You will want to be stronger for what comes next.')
  ]
};

/* --------------------------- BOSS: ROTTING SAINT --------------------------- */
SCENES.boss_saint = {
  bg: 'depths', fx: 'spores',
  actors: [
    { k: 'hero', x: 116, y: 204, sc: 2.2 },
    { k: 'mara', x: 164, y: 190, sc: 1.4 },
    { k: 'saint', x: 260, y: 202, sc: 1.7 }
  ],
  lines: [
    HD_L('THE SAINT', 'Little flame. Little flame. The garden is hungry.'),
    HD_L('MARA', 'He was a priest. He promised the city would be remembered. Then he ate the memories himself.'),
    { if: () => hdFlag('orin'), who: 'ORIN', text: 'The flowers are his congregation. Every one is a name. Do not let them touch you.' },
    HD_L('THE SAINT', 'We only wanted to keep them. We only wanted to keep them.'),
    HD_CH(
      HD_OPT('Burn the flowers first.', { hint: 'The Saint opens slowly.', do: () => { HD_BOSS_MOD = { hp: .8 }; hdSetFlag('burnedFirst'); } }),
      HD_OPT('Speak to him.', { hint: 'Lore. He may remember.', do: () => { hdLore('rot'); hdAddTrust(1); } }),
      HD_OPT('Say nothing.', { hint: 'Some prayers are private.' })
    ),
    { if: () => hdFlag('heardDoor'), who: 'YOU', text: 'Aurel sent me.' },
    { if: () => hdFlag('heardDoor'), who: 'THE SAINT', text: 'Aurel... Aurel is the lid. We are the jar. Do not open the jar.' },
    HD_L('THE SAINT', 'THE GARDEN KEEPS WHAT THE RIVER COULD NOT.'),
    HD_CAP('THE ROTTING SAINT', 'THE GARDEN KEEPS ITS OWN', 2.6, 'BOSS')
  ]
};

SCENES.ch2_outro = {
  bg: 'depths', fx: 'spores',
  actors: [
    { k: 'hero', x: 120, y: 204, sc: 2.1 },
    { k: 'mara', x: 166, y: 190, sc: 1.4 }
  ],
  lines: [
    HD_L('NARRATOR', 'The Saint comes apart like wet paper. Beneath him, the garden is still growing.'),
    HD_L('MARA', 'The rot is not evil. It is hungry. There is a difference, and it does not help.'),
    { if: () => hdFlag('orin'), who: 'ORIN', text: 'If we burn it, the names go with it. If we leave it, it will grow back. Either way, something ends.' },
    HD_CH(
      HD_OPT('Burn the garden.', { hint: '+1 damage, +40 embers.', do: () => { hdSetFlag('burnedGrove'); hdPermanentDmg(1); hdEmbers(40); } }),
      HD_OPT('Let it regrow.', { hint: '+1 heart, +trust.', do: () => { hdSetFlag('sparedGrove'); hdPermanentHp(1); hdAddTrust(1); } })
    ),
    { if: () => hdFlag('burnedGrove'), who: 'NARRATOR', text: 'You put the torch to the roots. The flowers scream with a hundred voices, then are quiet. The air is cleaner. The silence is worse.' },
    { if: () => hdFlag('burnedGrove'), who: 'MARA', text: 'We will carry them. That is what the living are for.' },
    { if: () => hdFlag('sparedGrove'), who: 'NARRATOR', text: 'You step over the roots. Behind you, something small and green opens toward the dark, hungry and hopeful.' },
    { if: () => hdFlag('sparedGrove'), who: 'MARA', text: 'You let it live.' },
    { if: () => hdFlag('sparedGrove'), who: 'YOU', text: 'It was not its fault it was hungry.' },
    HD_L('MARA', 'The camp is above the rot line. Come. The Ember Halls are next, and they will not be gentle.')
  ]
};

/* --------------------------- BOSS: HOLLOW KING --------------------------- */
SCENES.boss_king = {
  bg: 'throne', fx: 'void',
  actors: [
    { k: 'hero', x: 118, y: 206, sc: 2.2 },
    { k: 'mara', x: 166, y: 192, sc: 1.4 },
    { k: 'king', x: 258, y: 196, sc: 1.7 }
  ],
  lines: [
    HD_CAP('THE HOLLOW KING', 'THE FIRST LAMPLIGHTER', 3, 'THE THRONE'),
    HD_L('NARRATOR', 'The throne is made of doors. Each one whispers.'),
    HD_L('AUREL', 'Another lantern. Another little sun. How many of you have come down here to kill me?'),
    HD_L('MARA', 'Aurel. It is me.'),
    HD_L('AUREL', '...Mara? No. Mara drowned. I kept her. I kept everyone. That is what a king does.'),
    HD_L('YOU', 'You call this keeping?'),
    HD_L('AUREL', 'I call it love with nowhere left to go.'),
    HD_CH(
      HD_OPT('I will free you.', { hint: 'Set { vow: free }', set: { vow: 'free' } }),
      HD_OPT('I will end you.', { hint: 'Set { vow: end }', set: { vow: 'end' } }),
      HD_OPT('I do not know.', { hint: 'Set { vow: unknown }', set: { vow: 'unknown' } })
    ),
    { if: () => STORY.flags.vow === 'free', who: 'AUREL', text: 'Free. The word is so old it has forgotten its shape. Try it anyway.' },
    { if: () => STORY.flags.vow === 'end', who: 'AUREL', text: 'Then you are honest. I have always respected a blade that does not pretend to be a key.' },
    { if: () => STORY.flags.vow === 'unknown', who: 'AUREL', text: 'Good. Certainty is how I got here.' },
    HD_L('AUREL', 'Then come and find out what you are made of.'),
    HD_CAP('THE HOLLOW KING', 'THE LAST LAMPLIGHTER', 2.6, 'BOSS')
  ]
};

SCENES.king_phase2 = {
  bg: 'throne', fx: 'void',
  actors: [
    { k: 'hero', x: 118, y: 206, sc: 2.1 },
    { k: 'mara', x: 162, y: 192, sc: 1.35 },
    { k: 'king', x: 252, y: 196, sc: 1.6 }
  ],
  lines: [
    HD_L('AUREL', 'Do you hear them? Every name I swallowed is screaming at once.'),
    HD_L('MARA', 'Let them go.'),
    HD_L('AUREL', 'They will drown again. They will forget. I am the only thing between them and nothing.'),
    HD_L('YOU', 'Then let me be the second thing.'),
    HD_L('AUREL', '...You remind me of her. That is not a kindness.')
  ]
};

SCENES.king_phase3 = {
  bg: 'throne', fx: 'void',
  actors: [
    { k: 'hero', x: 116, y: 206, sc: 2.1 },
    { k: 'mara', x: 160, y: 192, sc: 1.35 },
    { k: 'king', x: 252, y: 194, sc: 1.7, a: .8 }
  ],
  lines: [
    HD_L('AUREL', 'I have held this city so long that I have forgotten which heartbeat is mine.'),
    HD_L('MARA', 'Then let us remember it for you.'),
    HD_L('AUREL', 'Mara. If you are real... do not let me hurt you again.'),
    HD_L('MARA', 'I am real. I am the flame you left behind.'),
    HD_L('AUREL', 'Then burn, little sister. Burn it all down.')
  ]
};

/* --------------------------- FINAL CHOICE --------------------------- */
SCENES.final_choice = {
  bg: 'throne', fx: 'void',
  actors: [
    { k: 'hero', x: 120, y: 206, sc: 2.1 },
    { k: 'mara', x: 168, y: 192, sc: 1.4 },
    { k: 'king', x: 254, y: 198, sc: 1.4, a: .55, ph: 2 }
  ],
  lines: [
    HD_L('NARRATOR', 'The crown rolls across the floor. It is lighter than it looks. It is heavier than it looks.'),
    HD_L('AUREL', 'The crown... is heavy...'),
    HD_L('MARA', 'The lantern is ours again. We can end this. Or we can carry it.'),
    HD_L('YOU', 'What happens if I put it down?'),
    HD_L('MARA', 'The Hollow ends. Everything it kept ends with it. Every memory of Veyra. Even me.'),
    HD_L('MARA', 'Or you can take it. It will fit. Crowns always do.'),
    HD_CH(
      HD_OPT('Break the crown. Let it end.', { hint: 'Ending: ASHES', do: () => { STORY.ending = 'ashes'; }, next: 'ending_ashes' }),
      HD_OPT('Take the crown.', { hint: 'Ending: THE CROWN', do: () => { STORY.ending = 'crown'; }, next: 'ending_crown' }),
      HD_OPT('Give the lantern to Mara.', {
        hint: 'Ending: DAWN',
        locked: () => !hdDawnReady(),
        lockHint: 'You are not ready to give it back.',
        do: () => { STORY.ending = 'dawn'; },
        next: 'ending_dawn'
      }),
      HD_OPT('Speak his true name.', {
        hint: 'Ending: FORGOTTEN',
        locked: () => !hdSecretReady(),
        lockHint: 'You do not know him well enough.',
        do: () => { STORY.ending = 'forgotten'; },
        next: 'ending_forgotten'
      })
    )
  ]
};

/* --------------------------- ENDINGS --------------------------- */
SCENES.ending_ashes = {
  bg: 'ashes', fx: 'ash',
  actors: [{ k: 'hero', x: 172, y: 204, sc: 2.2 }],
  lines: [
    HD_CAP('ENDING', 'ASHES', 3.2, 'THE CROWN BREAKS'),
    HD_L('NARRATOR', 'You bring the lantern down on the crown. It cracks like a bell. The sound goes on for a long time.'),
    HD_L('NARRATOR', 'The Hollow goes out like a lamp. The doors stop whispering. The city forgets itself.'),
    HD_L('YOU', 'Mara?'),
    HD_L('NARRATOR', 'No one answers. There is only the sound of water finding its level.'),
    HD_L('NARRATOR', 'You climb out of Ashfall at dawn. The village is grey and quiet. The people look at you as if you are a stranger.'),
    HD_L('NARRATOR', 'No one remembers your name. You are alive. You are the only thing left that does.'),
    HD_CAP('ASHES', 'SURVIVED. FORGOTTEN.', 3.6, 'ENDING I OF IV')
  ]
};

SCENES.ending_crown = {
  bg: 'crown', fx: 'embers',
  actors: [{ k: 'hero', x: 176, y: 200, sc: 2.2 }],
  lines: [
    HD_CAP('ENDING', 'THE CROWN', 3.2, 'THE KING IS DEAD'),
    HD_L('NARRATOR', 'You set the crown on your head. The voices are loud, then quiet, then yours.'),
    HD_L('MARA', 'Do not do this. Please.'),
    HD_L('YOU', 'I will carry them. I am strong enough.'),
    HD_L('NARRATOR', 'Mara burns down to a single blue spark. It hovers before your eyes for a moment, like a question. Then it goes out.'),
    HD_L('NARRATOR', 'The throne is comfortable. It was made for someone exactly your size.'),
    HD_L('NARRATOR', 'A hundred years from now, another lantern will come down the stairs.'),
    HD_L('AUREL', 'Turn back. The graves are full.'),
    HD_CAP('THE CROWN', 'THE CYCLE CONTINUES.', 3.6, 'ENDING II OF IV')
  ]
};

SCENES.ending_dawn = {
  bg: 'dawn', fx: 'embers',
  actors: [{ k: 'hero', x: 140, y: 204, sc: 2.2 }, { k: 'mara', x: 190, y: 196, sc: 1.5 }],
  lines: [
    HD_CAP('ENDING', 'DAWN', 3.2, 'THE LANTERN RETURNS'),
    HD_L('NARRATOR', 'You place the lantern in Mara\'s hands. She holds it the way she must have held it on the last night of Veyra.'),
    HD_L('MARA', 'I was never the light. I was just the one who stayed.'),
    HD_L('YOU', 'That is what a light is.'),
    HD_L('NARRATOR', 'Aurel\'s chest opens. The city pours out: rooftops, rain, a red sun, a thousand names. They rise through the Hollow like sparks through a chimney.'),
    HD_L('AUREL', 'I can... put it down.'),
    HD_L('MARA', 'Then put it down, brother. I have you.'),
    HD_L('NARRATOR', 'The crown melts. The Hollow closes. Above, in Ashfall, the sky turns the color of a held breath, and the first real dawn in eleven days begins.'),
    HD_L('NARRATOR', 'Someone is laughing in the street. Someone else is crying. Both are remembering.'),
    HD_CAP('DAWN', 'THE CITY REMEMBERS. SO DO YOU.', 3.6, 'ENDING III OF IV')
  ]
};

SCENES.ending_forgotten = {
  bg: 'forgotten', fx: 'snow',
  actors: [{ k: 'hero', x: 176, y: 202, sc: 2.1, a: .9 }],
  lines: [
    HD_CAP('ENDING', 'FORGOTTEN', 3.2, 'THE NAME IS SPOKEN'),
    HD_L('NARRATOR', 'You kneel beside the dying king and say the name the door taught you.'),
    HD_L('YOU', 'Aurel Vane.'),
    HD_L('NARRATOR', 'The crown opens. Not cracks. Opens, like a hand. Every name inside goes free at once.'),
    HD_L('AUREL', 'Oh. There they are.'),
    HD_L('MARA', 'Aurel?'),
    HD_L('NARRATOR', 'The city exhales. Veyra rises out of the dark in one last clear image, complete and unbearably ordinary, and then it is gone.'),
    HD_L('NARRATOR', 'The world forgets Veyra. The Hollow ends. Mara fades with a smile that has no name left to hold it.'),
    HD_L('NARRATOR', 'You wake on the hill above Ashfall. The lantern in your hand is cold and empty. Your cheeks are wet.'),
    HD_L('NARRATOR', 'You do not remember why. You only know that something enormous has been forgiven.'),
    HD_CAP('FORGOTTEN', 'THE HOLLOW IS GONE. THE NAME REMAINS.', 3.8, 'ENDING IV OF IV')
  ]
};

/* --------------------------- CAMP TALKS --------------------------- */
SCENES.camp_mara = {
  bg: 'camp', fx: 'embers',
  actors: [{ k: 'hero', x: 138, y: 196, sc: 2.1 }, { k: 'mara', x: 204, y: 166, sc: 1.4 }],
  lines: [
    HD_L('MARA', 'The fire will hold until dawn. Such as dawn is, down here.'),
    { if: () => STORY.chapter === 1, who: 'MARA', text: 'You asked what I am. I was a lamplighter of Veyra. On the last night, I lit the lamps while the water rose.' },
    { if: () => STORY.chapter === 1, who: 'MARA', text: 'My brother went into the dark to hold the city\'s memory. I have been holding the light ever since.' },
    { if: () => STORY.chapter === 1 && hdFlag('heardDoor'), who: 'YOU', text: 'Aurel. The door said his name.' },
    { if: () => STORY.chapter === 1 && hdFlag('heardDoor'), who: 'MARA', text: 'Then you have heard him. He is still in there.' },
    { if: () => STORY.chapter >= 2, who: 'MARA', text: 'Aurel was not a tyrant. He was a man who could not bear to let a city go. I have had three hundred years to decide which is worse.' },
    { if: () => STORY.chapter >= 2, who: 'MARA', text: 'I still do not know.' },
    { if: () => hdFlag('branded'), who: 'MARA', text: 'The brand is quiet now. It is waiting. So am I.' },
    { if: () => !hdFlag('branded') && (STORY.flags.trust || 0) >= 2, who: 'MARA', text: 'You kept your name. I did not know how much I needed someone to do that.' },
    { if: () => (STORY.flags.trust || 0) < 0, who: 'MARA', text: 'You still do not trust me. That is all right. Trust is a thing you build out of better nights than this.' },
    HD_L('MARA', 'Rest. The dark is patient, but the fire is not.')
  ]
};

SCENES.camp_gk = {
  bg: 'camp', fx: 'embers',
  actors: [{ k: 'hero', x: 132, y: 196, sc: 2.1 }, { k: 'gk', x: 222, y: 198, sc: 1.5 }],
  lines: [
    HD_L('GRAVEKEEPER', 'Small fire. Good fire. It remembers being a tree.'),
    HD_L('YOU', 'Do you remember your name?'),
    HD_L('GRAVEKEEPER', 'You gave it to me. It is here. It is heavy and light at the same time. Like a child.'),
    { if: () => STORY.chapter >= 2, who: 'GRAVEKEEPER', text: 'The garden below is loud. It says my name wrong. I do not correct it.' },
    { if: () => STORY.chapter >= 2, who: 'GRAVEKEEPER', text: 'When you go down again, I will guard the fire. If the fire goes out, I will be very angry. Then I will be sad. Then I will be angry again.' },
    HD_L('YOU', 'That is a good plan.'),
    HD_L('GRAVEKEEPER', 'I have many plans. Most of them are standing still.')
  ]
};

SCENES.camp_orin = {
  bg: 'camp', fx: 'embers',
  actors: [{ k: 'hero', x: 136, y: 196, sc: 2.1 }, { k: 'orin', x: 224, y: 198, sc: 1.9 }],
  lines: [
    HD_L('ORIN', 'I have been reading the walls. They are extremely rude, but informative.'),
    HD_L('YOU', 'What do they say?'),
    HD_L('ORIN', 'That the crown is a vessel made of names. Aurel poured Veyra into it to save the city from the water. The Hollow is what happens when a vessel forgets it is a vessel and starts believing it is a king.'),
    { if: () => hdFlag('sawTruth'), who: 'ORIN', text: 'You saw the mirror. Then you know he did it for love. That is the worst kind of villain. It leaves you nothing to hate cleanly.' },
    { if: () => STORY.chapter >= 2, who: 'ORIN', text: 'I have also discovered that the campfire is an excellent place to think. I have discovered nothing else. Do not tell the Witch.' },
    HD_L('ORIN', 'When this is over, I would like to see the sun. I have read about it. I would like to check the sources.')
  ]
};

SCENES.camp_witch = {
  bg: 'camp', fx: 'embers',
  actors: [{ k: 'hero', x: 134, y: 196, sc: 2.1 }, { k: 'witch', x: 226, y: 198, sc: 1.8 }],
  lines: [
    HD_L('EMBER WITCH', 'Do not look so surprised. Fire is welcome anywhere there is something to burn.'),
    HD_L('YOU', 'Why are you helping us?'),
    HD_L('EMBER WITCH', 'Because the Hollow is a bad flame. It eats without heat. It remembers without love. I am a professional. I have standards.'),
    { if: () => hdFlag('branded'), who: 'EMBER WITCH', text: 'The brand suits you. It has stopped trying to crawl off your wrist, which is a compliment.' },
    { if: () => !hdFlag('branded'), who: 'EMBER WITCH', text: 'You refused me. Good. The best candles are the ones that do not know they are candles.' },
    HD_L('EMBER WITCH', 'When you reach the throne, do not ask the king for permission. He has been giving it to himself for three hundred years.')
  ]
};

/* --------------------------- MISC --------------------------- */
SCENES.ch1_camp_intro = {
  bg: 'camp', fx: 'embers',
  actors: [{ k: 'hero', x: 136, y: 196, sc: 2.1 }, { k: 'mara', x: 206, y: 168, sc: 1.4 }],
  lines: [
    HD_CAP('THE LAST CAMP', 'A FIRE ABOVE THE WATERLINE', 2.8, 'REST'),
    HD_L('MARA', 'The fire is small, but it is ours. Sit. You have earned one quiet thing.'),
    HD_L('MARA', 'The Garden District is below the watermark. The rot there is old and patient. It grows toward anything that still remembers being warm.'),
    HD_L('MARA', 'Before we go, there are things you can do. Speak to whoever is still alive. Spend what you have carried. Then we descend.')
  ]
};

SCENES.ch2_camp_intro = {
  bg: 'camp', fx: 'embers',
  actors: [{ k: 'hero', x: 136, y: 196, sc: 2.1 }, { k: 'mara', x: 206, y: 168, sc: 1.4 }],
  lines: [
    HD_CAP('THE LAST CAMP', 'A FIRE ABOVE THE ROT LINE', 2.8, 'REST'),
    HD_L('NARRATOR', 'The garden is quiet behind you. The fire has been waiting. It looks smaller than it did before.'),
    HD_L('MARA', 'You burned a saint. Or you let him keep growing. Either way, the rot remembers you now.'),
    HD_L('MARA', 'The Ember Halls are below this. The air there remembers burning. Every flame is somebody\'s last thought.'),
    { if: () => hdFlag('orin'), who: 'ORIN', text: 'I have made a map of the forge from memory. It is mostly guesswork and profanity, but the directions are sound.' },
    { if: () => hdFlag('sparedGK'), who: 'GRAVEKEEPER', text: 'The fire says your name when you are not here. I tell it to be patient. It is not very good at patience.' },
    HD_L('MARA', 'Rest. Speak to whoever is still standing. Spend what the deep has given you. Then we go down one last time.')
  ]
};
