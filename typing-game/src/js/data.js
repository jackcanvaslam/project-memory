/* Dragon Keys - game data: worlds, levels, words, shop items */
'use strict';

const WORLDS = [
  { id: 1, name: 'Moonlit Meadow', theme: 'meadow', skill: 'Home row',                 reward: { kind: 'trail', id: 'comet' } },
  { id: 2, name: 'Sky Peaks',      theme: 'peaks',  skill: 'Top row',                  reward: { kind: 'crest', id: 'antlers' } },
  { id: 3, name: 'Crystal Cave',   theme: 'cave',   skill: 'Bottom row',               reward: { kind: 'trail', id: 'prism' } },
  { id: 4, name: 'Night Citadel',  theme: 'castle', skill: 'Capitals and punctuation', reward: { kind: 'crest', id: 'halo' } },
  { id: 5, name: 'Dragon Summit',  theme: 'summit', skill: 'Real sentences',           reward: { kind: 'skin', id: 'gold' } },
];

/* kind: keys = two new keys, review = words from everything so far,
   authored = hand-written lines, common = most-used words */
const LEVELS = [
  { id: '1-1', world: 1, title: 'F and J', keys: 'fj', kind: 'keys' },
  { id: '1-2', world: 1, title: 'D and K', keys: 'dk', kind: 'keys' },
  { id: '1-3', world: 1, title: 'S and L', keys: 'sl', kind: 'keys' },
  { id: '1-4', world: 1, title: 'A and ;', keys: 'a;', kind: 'keys' },
  { id: '1-5', world: 1, title: 'G and H', keys: 'gh', kind: 'keys' },
  { id: '1-6', world: 1, title: 'Meadow Final Run', keys: '', kind: 'review' },

  { id: '2-1', world: 2, title: 'E and I', keys: 'ei', kind: 'keys' },
  { id: '2-2', world: 2, title: 'R and U', keys: 'ru', kind: 'keys' },
  { id: '2-3', world: 2, title: 'T and Y', keys: 'ty', kind: 'keys' },
  { id: '2-4', world: 2, title: 'W and O', keys: 'wo', kind: 'keys' },
  { id: '2-5', world: 2, title: 'Q and P', keys: 'qp', kind: 'keys' },
  { id: '2-6', world: 2, title: 'Sky Peaks Final Run', keys: '', kind: 'review' },

  { id: '3-1', world: 3, title: 'V and M', keys: 'vm', kind: 'keys' },
  { id: '3-2', world: 3, title: 'C and ,', keys: 'c,', kind: 'keys' },
  { id: '3-3', world: 3, title: 'B and N', keys: 'bn', kind: 'keys' },
  { id: '3-4', world: 3, title: 'X and .', keys: 'x.', kind: 'keys',
    extra: ['the fox sat on a box.', 'six mice fix the van.', 'a fox can relax next to me.'] },
  { id: '3-5', world: 3, title: 'Z and /', keys: 'z/', kind: 'keys',
    extra: ['on/off in/out yes/no', 'zip/zap zig/zag up/down', 'a lazy lizard dozes.'] },
  { id: '3-6', world: 3, title: 'Crystal Cave Final Run', keys: '', kind: 'review' },

  { id: '4-1', world: 4, title: 'Left Shift', keys: '', kind: 'authored', shift: 'left',
    intro: 'Hold the LEFT Shift key with your left pinky, then tap the letter with your right hand.',
    lines: ['Jj Kk Ll Hh Uu Ii', 'Mm Nn Oo Pp Yy', 'Jill Kim Liam Mia Noah', 'Hank Lily Otto Paul Uma',
      'I like Milo and Juno.', 'My kite is up high.', 'Hello, Polly. Hi, Leo.', 'No one saw Kai jump.',
      'You look happy, Nina.'] },
  { id: '4-2', world: 4, title: 'Right Shift', keys: '', kind: 'authored', shift: 'right',
    intro: 'Hold the RIGHT Shift key with your right pinky, then tap the letter with your left hand.',
    lines: ['Ff Dd Ss Aa Gg Tt', 'Rr Ee Ww Qq Cc Vv', 'Sam Tess Ava Dan Emma', 'Ben Zoe Rosa Finn Grace',
      'The dragon can fly.', 'We saw a red fox.', 'Tess and Dan ran fast.', 'A cat sat with Bella.',
      'Good dragons share.', 'Quinn fed the ducks.'] },
  { id: '4-3', world: 4, title: "? and '", keys: "?'", kind: 'authored',
    intro: "The question mark is Shift and the / key. The apostrophe is next to the ; key.",
    lines: ["j? k? l? ;? ?? ;' ';", "it's I'm don't can't", 'What is that?', "Who is it? It's me.",
      'Can dragons swim?', "I can't see the cave.", "Where's my hat?", "Don't wake the cat.",
      "Is it Ava's kite?", 'Why is the sky blue?', "Let's go, shall we?"] },
  { id: '4-4', world: 4, title: 'Real Sentences', keys: '', kind: 'authored',
    lines: ['{P} is my best friend.', 'Do you like to fly, {P}?', 'We flew over the castle.',
      'The king waved at us.', "It's a sunny day, isn't it?", 'Quick, catch that star.',
      'Foxes, cats, and pandas play.', 'Can you zoom past the moon?', '{K} and {P} love to explore.',
      "Yes, we can. Let's go."] },

  { id: '5-1', world: 5, title: 'Speedy Words', keys: '', kind: 'common' },
  { id: '5-2', world: 5, title: 'Short Sentences', keys: '', kind: 'authored', pick: 10,
    lines: ['The sun is warm today.', 'My dragon likes to nap.', 'We ran up the green hill.', 'Can you see the moon?',
      'I love my little fox.', 'The bunny hops so high.', 'Pandas eat a lot.', 'Is that your red kite?',
      'She found a gold key.', 'The cat sat on my lap.', "Let's fly to the lake.", 'He made a big cake.',
      'Stars shine at night.', "Don't drop the gems.", 'What a lovely day.', 'A fox ran past us.',
      'We swam in the cool sea.', 'Look at that rainbow.', 'I can type so fast now.', 'My friend is very kind.',
      'The cave was dark.', 'Who took my hat?', 'Birds sing at dawn.', 'It rained all day.'] },
  { id: '5-3', world: 5, title: 'Longer Sentences', keys: '', kind: 'authored', pick: 6,
    lines: ['The little dragon flew over the sleepy town.', 'Every morning, the fox and the bunny race to the pond.',
      'My kitten likes to chase a ball of yellow yarn.', 'We packed apples, bread, and cheese for the picnic.',
      'Can you find the secret door behind the waterfall?', "The wizard's hat was full of tiny, sparkly stars.",
      'A panda sat in the tall grass and ate bamboo.', 'When it rains, the cave fills with glowing crystals.',
      "I didn't know that dragons were afraid of mice.", 'The castle has seven towers and a bright red flag.',
      'Quietly, the owl watched the moon rise over the hills.', 'She zipped up her jacket and jumped in the puddle.'] },
  { id: '5-4', world: 5, title: 'Animal Facts', keys: '', kind: 'authored', pick: 6,
    lines: ['A group of owls is called a parliament.', 'Sea otters hold hands when they sleep.',
      'Butterflies taste with their feet.', 'An octopus has three hearts.', 'Honey never goes bad.',
      'Pandas eat bamboo for most of the day.', "Elephants can't jump.", 'Koalas sleep about twenty hours a day.',
      "Owls can't move their eyes, so they turn their heads.", 'Frogs drink water through their skin.',
      'A group of flamingos is called a flamboyance.', "Penguins can't fly, but they swim very fast.",
      'A baby rabbit is called a kit.', 'Dolphins sleep with one eye open.'] },
  { id: '5-5', world: 5, title: 'The Lost Star, Part 1', keys: '', kind: 'authored',
    lines: ['One night, a star fell from the sky.', '{P} saw it land far away.',
      '{K} said they must help it get home.', 'They flew over hills and lakes.', 'A fox showed them the path.',
      'The star was stuck in a tall tree.', 'It was small, cold, and very sad.',
      "Don't worry, said {P}. We're here."] },
  { id: '5-6', world: 5, title: 'The Lost Star, Part 2', keys: '', kind: 'authored',
    lines: ['{P} took a deep breath.', 'A warm, soft flame lit the night.', 'The star began to glow again.',
      'It asked if they could fly it home.', 'Up they went, past the clouds.',
      'The moon smiled as they zoomed by.', 'At last, the star was home.', 'It twinkled twice to say thanks.',
      '{K} and {P} flew home, sleepy and proud.', 'What a night. What a team.'] },
];

/* the last level of each world is a boss fight (when enemies are switched on) */
const BOSS_LEVELS = new Set(WORLDS.map(w => LEVELS.filter(l => l.world === w.id).pop().id));

/* Which finger presses each key. L/R + finger number: 1 pinky, 2 ring, 3 middle, 4 pointer, 5 thumb */
const FINGERS = {
  L1: { hand: 'left',  name: 'pinky',   keys: '`1qaz' },
  L2: { hand: 'left',  name: 'ring',    keys: '2wsx' },
  L3: { hand: 'left',  name: 'middle',  keys: '3edc' },
  L4: { hand: 'left',  name: 'pointer', keys: '45rtfgvb' },
  R4: { hand: 'right', name: 'pointer', keys: '67yuhjnm' },
  R3: { hand: 'right', name: 'middle',  keys: '8ik,' },
  R2: { hand: 'right', name: 'ring',    keys: '9ol.' },
  R1: { hand: 'right', name: 'pinky',   keys: "0-=p[]\\;'/" },
  T:  { hand: 'both',  name: 'thumb',   keys: ' ' },
};
const SHIFTED = { '?': '/', ':': ';', '"': "'", '<': ',', '>': '.', '!': '1' };
const KEY_FINGER = {};
for (const f in FINGERS) for (const ch of FINGERS[f].keys) KEY_FINGER[ch] = f;

/* Keyboard rows: [label, width in key units, id] ; id defaults to the label */
const KEY_ROWS = [
  [['`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['-'], ['='], ['delete', 2, 'Backspace']],
  [['tab', 1.5, 'Tab'], ['q'], ['w'], ['e'], ['r'], ['t'], ['y'], ['u'], ['i'], ['o'], ['p'], ['['], [']'], ['\\', 1.5]],
  [['caps', 1.8, 'CapsLock'], ['a'], ['s'], ['d'], ['f'], ['g'], ['h'], ['j'], ['k'], ['l'], [';'], ["'"], ['enter', 2.2, 'Enter']],
  [['shift', 2.3, 'ShiftLeft'], ['z'], ['x'], ['c'], ['v'], ['b'], ['n'], ['m'], [','], ['.'], ['/'], ['shift', 2.7, 'ShiftRight']],
  [['space', 7, ' ']],
];

/* A kid-friendly word list. Levels pick only the words she can already type. */
const WORDS = (
 'a ad add adds aha ah alas alfalfa all as ash ask asks dad dads dash fad fall falls flag flags flash flask '+
 'gal gala gas glad glass had half hall halls has hash haha lad lads lag lash lass sad saga '+
 'salad salads salsa shall slash shh '+
 'age ages agile aide aisle ale alike aside deal desk dial did dig dish disk eagle ease easel '+
 'edge eel egg eggs elf elk else fade fail fake fed fee feed feel field fig figs file fill fish fled flee '+
 'geese gel giggle gill glide glee hail head heal heel held hi hid hide high hike hill his idea ideas idle if '+
 'ill is isle jade jiggle keel kid kids kiss lake lakes lead leaf leak ledge leg legs less lid lie life '+
 'like likes safe said sail sale sea seal see seed seek sell she shed shelf shell shield side sigh silk ski '+
 'skid skill sled sleigh slid slide '+
 'are air arise dark dare dear deer dress drill dug dull dusk ear ears fair far fare fear fire '+
 'fluff fresh fridge fruit fuel full fur fuse gear girl glue grade grass gray? green grill gush '+
 'hair hard hare hear her here hug huge hush jar judge jug juggle juice lark laugh lush '+
 'rail rake real red reed rich ride rid rise risk rug rule rush sugar sure surf use used user '+
 'shark share shrug sir usual usual '+
 'art ate daily dairy data date day days dirt dirty diet duty dusty eat eight early earth easy eat eye eyes '+
 'fast fat fairy feet fifty fit flat fly fry frilly furry gate get gift glitter grey great guitar gusty '+
 'hat hay heat hit hut jelly jet just key keys kit kite kitty lady late lay left let light lily list '+
 'lit little lady rat rate ray rest right salty say seat set shy silly sit site sky sleet star stare start '+
 'stay steady stir story street study style suit tail take tale talk tall tar task taste tea tear teddy '+
 'tell that the their these they this thirsty tide tidy tie tiger tight tile till tilt tire tray treat tree '+
 'trust try tug turkey turtle yard year yell yes yet tasty test thud study their kitty '+
 'ago allow also arrow away awful dew dog dogs door doll do dot dough dry draw drew dwarf elbow fellow few '+
 'flew floor flow flower fog fold folk follow food foot for fork forest forty four frog flour '+
 'frost go goat gold golf good goose got glow grow hello hero hold hole hood hook hoot horse hot '+
 'hour house how howl jaw joy jog jolly joke kiwi know law leftover lost lot loud love low lower oak '+
 'oar oat odd of off oil old or order other otter our out owl old otter raw road roar rod role roll roof '+
 'root rose row saw sew show shower slow soak sofa soft soil sold solid sorry sort so soda sour south '+
 'star straw sway sweat sweet swirl sword tattoo throw to today toe toast together told too took '+
 'tool tooth tow towel tower town toy two wag wait wake walk wall was wash water wave way '+
 'we weak wear weather web week weigh well were west wet what wheat wheel where white who whole why '+
 'wide wig wild will wire wise wish with wizard wolf wood wool word work world worry would '+
 'write wrote yellow yogurt you your youth whisker whistle wiggle willow wallow yolk '+
 'ape apple april deep dip drop equal equip flap flip gap gasp grape group happy harp heap help hip hop hope '+
 'hoop jeep jump keep lap leap lip liquid loop pad page paid pail pair pal pale palm paper park part '+
 'party pass past paste pat path paw pay pea pear peel pet petal pie pig pile pill pillow pit plate play '+
 'please plug plus pod poet pole polite pool pop port post pot pour pout power pretty proud pull pup puppy '+
 'pure purple purr push put quad quake quality quart quarter quest queue quiet quill quilt quit quite quote '+
 'repair reply request require rip ripe rope ship shop sip skip slap sleep slip slope soap soup spark '+
 'speak speed spell spider spill spy square squad squeak squid squirt step stop strap stripe super supper '+
 'sweep tap tape tip top trap trip tulip type up upper upset wasp whip wipe wrap yelp typist pepper puddle '+
 'alarm am amaze? arm army dime dream drum family farm fame film flame form from game gem gems '+
 'give glove ham hammer have heavy him hive home hum jam jam lamp lime live love made magic mail '+
 'make male mall map mark market mask mat may maze? me meal meat meet melt met midday might mile '+
 'milk mill miss mist mix? mode moist mom moo mood moose mop more most mother mouse mouth move '+
 'movie mud muddy mug music must my myself oven over palm perform river room save seem seven '+
 'shimmer silver slam slim small smell smile smoke smooth solve some storm stream summer swim team them '+
 'time timer tomato tame term valley value vase very vest vet view village visit vivid vote warm wave '+
 'worm yam yummy visitor volume velvet motor mirror meadow marvel '+
 'act arch cake call calm came camp cap cape car card care cart case cast castle cat catch cave '+
 'chair chalk charm chase cheek cheer cheese cherry chest chew chick child chill chip choice city clap '+
 'class claw clay clear clever cliff climb cloak clock close cloth cloud clue coat cocoa code cold color '+
 'come comet cook cool copy coral core cost couch could cover cow craft crawl '+
 'cream creek crew crisp cross crow crowd cry crystal cup curl curve cut cute deck dice duck each '+
 'face fact forecast ice juice local lock luck lucky magic mice music ocean pack '+
 'peach pick picture piece place pocket race reach rice rich rock rocket scale scarf school '+
 'score scout secret slice sock space spice stack stick such teach thick track trick '+
 'truck twice voice watch which witch circle cactus circus cricket '+
 'able about above alone an and angel animal ant any baby back bad bag bake ball band bank barn base bat bath '+
 'be beach beak bean bear beat bed bee been begin bell belt bench bend berry best big bike bird '+
 'bit bite black blade blank blaze? blend blink block bloom blow blue boat body bold bone '+
 'book boot both bounce bow bowl boy brain branch brave bread break breath brick bridge bright bring '+
 'broom brother brown brush bubble bug build bump bun bunny bus bush busy but butter button buy by '+
 'cab cabin can candle candy cannot cabin chain chance change clean coin corn crown cub dance dawn '+
 'dinner done down dragon drink even fan fancy fin find fine finger finish friend fun funny garden gentle '+
 'giant golden gone grand grin ground hand hang hen hint honey horn hundred hunt in inch into island '+
 'join jungle keen kind king kitchen kitten knee knight knit knock know land lantern learn lemon '+
 'line lion listen long lunch man many men mind mint moon morning mountain name nap '+
 'near neat neck need nest net never new next? nice night nine no nod noise none noon north nose not '+
 'note nothing now number nurse nut oak ocean on once one onion only open orange own pan panda pancake pen '+
 'pencil penny person piano pin pine pink plan plane planet plant point pony pond princess queen rabbit rain '+
 'rainbow ran ribbon ring robin round run sand scene season second send shine sign sing snack snail snake '+
 'snow snug son song soon sound spin spoon spring stand stone sun sunny swan swing table ten tent than '+
 'thank then thin thing think tiny tune turn under unicorn until van violin wand want wind '+
 'window wing wink winter woman won wonder yawn young ribbon bonbon nibble bobbin '+
 'axe box boxes exact exam example excited exit expert explore extra fix fixed flex fox foxes index mix mixed '+
 'next pixel relax six sixty taxi text wax waxy '+
 'amaze blaze breeze buzz cozy crazy dizzy dozen fizz freeze frozen fuzzy graze jazz lazy lizard maze pizza '+
 'prize puzzle size sneeze wizard zap zebra zero zigzag zip zone zoo zoom '
).split(/\s+/).filter(Boolean).map(w => w.replace('?', ''));

const WORD_SET = Array.from(new Set(WORDS)).filter(w => /^[a-z]+$/.test(w));

/* The 120 or so most useful words for the Speedy Words level */
const COMMON_WORDS = ('the and you that was for are with his they at be this have from or one had by word but not ' +
  'what all were we when your can said there use an each which she do how their if will up other about out many ' +
  'then them these so some her would make like him into time has look two more write go see number no way could ' +
  'people my than first water been call who oil its now find long down day did get come made may part over new ' +
  'sound take only little work know place year live me back give most very after thing our just name good ' +
  'sentence man think say great where help through much before line right too mean old any same tell boy ' +
  'follow came want show also around form three small set put end does another well large must big even ' +
  'such because turn here why ask went men read need land different home us move try kind hand picture again ' +
  'change off play spell air away animal house point page letter mother answer found study still learn').split(' ');

/* ---------- Dragon looks ---------- */
/* a: head end of the body, b: tail end, fin: wings and fins, glow: r,g,b of the light it gives off */
const DRAGON_COLORS = {
  emerald: { name: 'Jade',     a: '#3dffc0', b: '#0b7f8a', fin: '#b6ff3d', belly: '#d8fff0', glow: '61,255,192',  price: 0 },
  ocean:   { name: 'Tide',     a: '#4fd8ff', b: '#2b4dff', fin: '#9dfcff', belly: '#e0f8ff', glow: '79,216,255',  price: 60 },
  sunset:  { name: 'Ember',    a: '#ffc23d', b: '#ff3d6e', fin: '#ffe66b', belly: '#fff3d0', glow: '255,150,60',  price: 60 },
  berry:   { name: 'Orchid',   a: '#ff6bdc', b: '#7a3dff', fin: '#ffc2f2', belly: '#ffe6fa', glow: '255,107,220', price: 80 },
  royal:   { name: 'Violet',   a: '#b79bff', b: '#3b2bd6', fin: '#ff8fe3', belly: '#efe8ff', glow: '167,139,255', price: 100 },
  shadow:  { name: 'Void',     a: '#5466ff', b: '#0d0f3a', fin: '#22e1ff', belly: '#9fb0ff', glow: '34,225,255',  price: 150 },
  gold:    { name: 'Legend',   a: '#fff3b0', b: '#ff9a1c', fin: '#ffffff', belly: '#fffbe6', glow: '255,214,110', price: -1 },
};

/* Trails stream from the tail in flight. price -1 means it is won, not bought. */
const TRAILS = {
  spark:  { name: 'Sparks',    price: 0,   colors: ['#ffffff', '#9dfcff'] },
  ember:  { name: 'Embers',    price: 50,  colors: ['#ffb02e', '#ff4d2e'] },
  frost:  { name: 'Frost',     price: 70,  colors: ['#e0f8ff', '#4fd8ff'] },
  bolt:   { name: 'Lightning', price: 110, colors: ['#fff36b', '#b79bff'] },
  comet:  { name: 'Comet',     price: -1,  colors: ['#ffffff', '#5466ff'], world: 1 },
  prism:  { name: 'Prism',     price: -1,  colors: ['#ff3df0', '#22e1ff'], world: 3 },
};

/* Crests change the horns */
const CRESTS = {
  horns:   { name: 'Horns',      price: 0 },
  blade:   { name: 'Blade',      price: 60 },
  twin:    { name: 'Long horns', price: 90 },
  spikes:  { name: 'Spine crown', price: 130 },
  antlers: { name: 'Antlers',    price: -1, world: 2 },
  halo:    { name: 'Halo',       price: -1, world: 4 },
};

const PET_NAMES = ['Ember', 'Nova', 'Onyx', 'Comet', 'Vex', 'Juniper', 'Blaze', 'Zephyr', 'Kai', 'Lyra',
  'Luna', 'Rune', 'Storm', 'Echo', 'Ash', 'Vega'];

const SPEED_NAMES = [[0, 'Warming up'], [6, 'Steady'], [10, 'Quick'], [15, 'Swift'],
  [20, 'Blazing'], [28, 'Dragon speed'], [38, 'Lightspeed']];

/* Stars a dragon needs to grow to each stage */
const GROW_AT = [0, 12, 34, 62];
const STAGE_NAMES = ['Hatchling', 'Wyrmling', 'Drake', 'Elder dragon'];

