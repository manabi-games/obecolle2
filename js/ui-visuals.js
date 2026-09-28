// Tiny, shared toy illustrations. Item IDs stay in catalog/save data; only their art changes.
const stroke = '#40545b';
const svg = (body, label) => `<svg class="toy-art" viewBox="0 0 96 84" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const rect = (x, y, w, h, fill, rx = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const circle = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const path = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const line = (d, color = stroke, width = 2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`;

function clothing(item) {
  const c = item.color || '#67adbc';
  const kind = item.visual || 'hoodie';
  const coat = ['astronaut', 'chef', 'scientist', 'royal', 'pirate', 'explorer', 'raincoat', 'scholar', 'sailor'].includes(kind);
  const body = path(coat ? 'M30 22 19 29 11 63 25 67 29 52 29 76 67 76 67 52 71 67 85 63 77 29 65 22 57 29 39 29Z' : 'M29 22 17 28 9 49 21 57 29 43 29 75 67 75 67 43 75 57 87 49 79 28 67 22 58 29 38 29Z', c);
  const base = body + path('M38 29 48 38 58 29', '#fff5df');
  const marks = {
    hoodie: path('M36 23Q48 12 60 23L57 32 48 39 39 32Z', '#e9f2d7') + line('M45 38V55M52 38V53', '#fff5df'),
    baseball: rect(30, 35, 36, 21, '#f5f2e5', 2) + line('M48 35V72M37 57H59', '#b55255', 3) + path('M28 19Q48 4 68 19L72 25H24Z','#d76662'),
    astronaut: circle(48, 20, 16, '#e3f3f4') + circle(48, 20, 11, '#79bbd0') + circle(48, 42, 13, '#dceaf1') + rect(40, 58, 16, 10, '#f6d35d') + circle(72, 38, 3, '#f6d35d'),
    ninja: path('M27 25Q30 4 48 4Q66 4 69 25Z','#2c415a') + path('M29 30H67V39H29Z', '#293f55') + line('M48 39V74M30 59H66', '#f4e6c2', 3),
    pirate: path('M18 25Q32 3 48 16Q64 3 78 25L48 19Z','#263d57') + path('M29 40 48 51 67 40 67 73 29 73Z', '#263d57') + path('M41 55 48 50 55 55 48 61Z', '#e9c456'),
    chef: circle(32,18,10,'#fffaf1') + circle(48,12,12,'#fffaf1') + circle(64,18,10,'#fffaf1') + rect(37, 35, 22, 33, '#fffaf1') + line('M48 35V68', '#d5b7a0') + circle(53, 46, 2, '#e96c67'),
    explorer: path('M25 24 34 12 62 12 71 24Z','#c5ae76') + rect(18,23,60,5,'#9d875d') + path('M34 37 48 48 62 37 67 70H29Z', '#b48e5b') + line('M48 48V73M29 55H67', '#e8d6a2'),
    dinosaur: path('M27 22 34 6 42 20 48 4 56 20 64 6 69 22', '#8cbe84') + path('M38 47 48 40 58 47 48 61Z', '#f7df86'),
    pajamas: line('M48 35V74M37 46H59M37 57H59', '#e7e9fc', 3) + circle(57, 42, 3, '#f1d766'),
    racer: path('M42 34H54L61 75H35Z', '#f6f4e4') + line('M48 34V75', '#e36862', 5),
    scientist: rect(36, 35, 25, 31, '#fcfbeb') + line('M48 35V74M34 58H62', '#849caa') + circle(56, 44, 3, '#e48264'),
    royal: path('M35 31 48 45 61 31 67 76H29Z', '#f5d783') + path('M43 52 48 45 53 52 48 60Z', '#dd6565'),
    hero: path('M28 27 13 71 31 67 48 44 65 67 83 71 68 27', '#f3cf62') + path('M40 47 55 47 48 61Z', '#e96764'),
    festival: line('M29 41 48 55 67 41M48 55V75', '#fff4dd', 5) + rect(42, 57, 12, 10, '#e5c66d'),
    scholar: path('M35 31 48 44 61 31 67 73H29Z', '#f4ebd5') + rect(36, 53, 24, 14, '#755c5a', 2),
    sailor: path('M28 30 48 50 68 30', '#f5eee1') + line('M37 40H59M48 50V75', '#315d84', 4),
    robot: rect(33, 35, 30, 29, '#bddce6') + circle(41, 47, 3, '#e76c65') + circle(55, 47, 3, '#efc454') + rect(42, 56, 12, 5, '#60949e'),
    raincoat: path('M28 25 48 9 68 25 63 42H33Z', '#e9db9c') + line('M48 42V75M32 61H64', '#f8f3da', 4),
    soccer: rect(31, 35, 34, 24, '#f5f7ec') + path('M48 39 55 45 52 53 44 53 41 45Z', '#384c54'),
    forest: path('M29 28 48 10 67 28 58 47 67 72H29L38 47Z', '#b8ce82') + circle(48, 51, 5, '#f1dd9a'),
  };
  return svg(base + (marks[kind] || marks.hoodie), item.name);
}

function hat(item) {
  const c = item.color || '#78b5bf', kind = item.visual || 'cap';
  const band = rect(18, 59, 60, 8, '#fff0ce', 4);
  const parts = {
    cap: path('M24 57Q25 27 49 28Q70 27 72 57Z', c) + path('M62 57Q88 55 87 64L67 64Z', '#edc662'),
    straw: path('M30 55 35 27 61 27 66 55Z', '#e5c77b') + rect(10, 56, 76, 8, '#e5c77b', 4) + rect(31, 45, 34, 7, c),
    explorer: path('M28 56 31 33Q48 16 65 33L68 56Z', '#c4ae75') + rect(13, 55, 70, 8, '#ae9361') + rect(30, 45, 37, 7, c),
    crown: path('M22 61 20 27 34 43 48 19 62 43 76 27 74 61Z', '#f1c34d') + circle(48, 48, 5, c),
    graduate: rect(25, 44, 46, 19, c) + path('M9 38 48 23 87 38 48 51Z', '#34485e') + line('M78 39V59', '#e5c263', 3),
    helmet: path('M20 59Q20 18 48 17Q76 18 76 59Z', c) + rect(18, 56, 60, 9, '#74848a') + rect(43, 30, 10, 22, '#f2cf71'),
    space: circle(48, 43, 28, '#e9f2ee') + rect(22, 57, 52, 8, c) + path('M28 45Q30 24 48 23Q66 24 68 45Z', '#76b9d4'),
    ninja: path('M20 58Q17 19 48 17Q79 19 76 58Z', '#34475b') + rect(22, 44, 52, 14, c) + line('M24 64 14 75M72 64 84 75', c, 5),
    pirate: path('M14 57Q27 19 48 31Q69 19 82 57Q48 42 14 57Z', '#35475a') + circle(48, 37, 5, '#fff1d1'),
    ears: path('M25 50 19 18 38 31 48 23 58 31 77 18 71 50Z', c) + path('M24 24 30 38 36 33M72 24 66 38 60 33', '#f1b9bf'),
    dino: path('M20 60Q17 21 48 20Q79 21 76 60Z', c) + path('M29 29 34 12 42 27 48 10 56 27 64 12 68 29', '#f0d882'),
    headband: path('M17 50Q48 31 79 50L77 60Q48 43 19 60Z', c) + line('M75 51 86 72M79 53 72 73', '#f8e8ca', 4),
    chef: rect(29, 35, 38, 27, '#f9f8e9') + circle(31, 34, 13, '#f9f8e9') + circle(48, 27, 14, '#f9f8e9') + circle(65, 34, 13, '#f9f8e9'),
    sailor: path('M27 57 32 33 64 33 69 57Z', '#f6f1db') + rect(15, 56, 66, 8, c) + circle(48, 43, 5, '#e8c963'),
    wizard: path('M26 60 50 9 70 60Z', c) + rect(13, 57, 70, 8, '#42536c') + circle(48, 38, 5, '#f3d464'),
    flower: path('M19 56Q48 39 77 56', 'none') + [28, 40, 54, 68].map((x,i) => circle(x, i%2 ? 47 : 51, 7, i%2 ? '#ef9ca4' : '#f4d86d')).join(''),
  };
  return svg((parts[kind] || parts.cap) + (!['straw','explorer','crown','graduate','helmet','space','ninja','pirate','headband','chef','sailor','wizard','flower'].includes(kind) ? band : ''), item.name);
}

function furniture(item) {
  const c = item.color || '#83bdb0', a = ['#eec6a0','#87c6d6','#a2bd7d','#aeb9cb','#a19bcd','#edb1b3'][item.theme || 0];
  const legs = line('M23 66V76M73 66V76', '#6d6659', 5);
  const art = [
    rect(18,38,60,29,c,9)+rect(21,27,54,21,a,9)+rect(22,55,52,12,c,5)+legs,
    rect(13,48,70,18,a,5)+rect(18,32,60,18,c,5)+rect(16,65,6,10,'#786b59')+rect(74,65,6,10,'#786b59'),
    rect(31,35,34,31,c,7)+rect(27,58,42,9,a,4)+line('M32 65 28 76M64 65 68 76','#74685b',4),
    rect(25,16,46,57,c,3)+line('M27 35H69M27 53H69','#e9d6a0',4)+rect(31,22,8,11,a)+rect(47,22,9,11,'#ec9e91')+rect(36,39,20,11,'#8eb8cf'),
    rect(11,42,74,25,a,5)+rect(11,27,16,31,c,4)+rect(16,67,6,9,'#816c5b')+rect(74,67,6,9,'#816c5b')+rect(32,46,46,14,'#fff3da'),
    rect(44,19,7,48,c)+path('M27 33 39 14 58 14 71 33Z',a)+circle(48,66,10,c),
    circle(48,42,23,'#f7f1da')+line('M48 42V27M48 42 59 49','#4d5f63',3)+rect(44,65,8,9,c),
    path('M47 73 47 49M47 57 30 43M47 62 66 42','#6c9e72')+circle(35,37,12,'#78b67c')+circle(60,34,14,'#89c782')+path('M33 64H63L58 76H38Z',c),
    rect(20,26,56,36,c,5)+rect(25,31,46,25,'#83bfce',2)+rect(42,62,12,8,'#6d6b70')+rect(34,70,28,5,'#6d6b70'),
    rect(19,30,58,39,c,3)+line('M20 50H76M48 50V69','#f2d5a3',3)+circle(38,41,2,'#e8d67a')+circle(59,41,2,'#e8d67a'),
  ][Number(item.shape || 0) % 10];
  const accent = [
    circle(78,14,5,'#efa8a4'),
    line('M68 17Q73 12 78 17T88 17','#73b8d3',3),
    path('M73 20 79 9 85 20Z','#83b978'),
    rect(72,10,10,14,'#a6c8cb',2)+circle(77,11,3,'#ebd8a0'),
    circle(77,15,6,'#f5d468'),
    path('M8 17Q22 5 35 17','#ee9baa'),
  ][item.theme || 0];
  return svg(art + accent, item.name);
}

export function itemArt(item) {
  if (item.type === 'clothing') return clothing(item);
  if (item.type === 'furniture') return furniture(item);
  if (item.id?.startsWith('hat_') || item.id?.startsWith('dojo_reward_')) return hat(item);
  if (item.id?.startsWith('glasses_')) {
    const c = item.color || '#4c7181', kind = item.visual || 'round';
    const lens = kind === 'square' || kind === 'goggles'
      ? rect(18,31,27,26,'#d4eced88',kind === 'goggles' ? 10 : 3)+rect(51,31,27,26,'#d4eced88',kind === 'goggles' ? 10 : 3)
      : kind === 'sunglasses'
        ? path('M15 33H45L43 53Q30 65 19 52ZM51 33H81L77 52Q66 65 53 53Z','#354251')
        : kind === 'star'
          ? path('M31 25 36 36 48 38 39 47 40 59 30 53 19 59 21 47 13 38 25 36Z','#f4d66e')+path('M65 25 70 36 82 38 73 47 75 59 64 53 53 59 55 47 47 38 59 36Z','#f4d66e')
          : kind === 'heart'
            ? path('M31 58Q14 47 18 36Q22 27 31 35Q40 27 44 36Q48 47 31 58ZM65 58Q48 47 52 36Q56 27 65 35Q74 27 78 36Q82 47 65 58Z','#f2aab2')
            : kind === 'flower'
              ? [31,65].map(x=>[0,72,144,216,288].map(deg=>circle(x+12*Math.cos(deg*Math.PI/180),43+12*Math.sin(deg*Math.PI/180),7,'#eda5af')).join('')+circle(x,43,9,'#e9f4e4')).join('')
              : kind === 'monocle'
                ? circle(64,43,14,'#e3f0ec99')+line('M77 49 73 69',c,3)
                : circle(31,43,14,'#d4eced88')+circle(65,43,14,'#d4eced88');
    return svg(lens+line('M17 39 7 35M45 42Q48 38 51 42M79 39 89 35',c,4),item.name);
  }
  if (item.type === 'wallpaper') return svg(rect(16,13,64,59,item.color)+line('M17 32H79M17 51H79M37 13V72M59 13V72','#fff7da',2), item.name);
  if (item.type === 'floor') return svg(path('M13 67 31 23 65 23 83 67Z',item.color)+line('M26 44H70M19 57H77M48 23V68','#fff5df',2), item.name);
  return svg(circle(48,42,20,item.color || '#ebc45e'), item.name);
}

export function townArt(item) {
  const c=item.color || '#e8ae70', a=item.accent || '#f5de80';
  const art=[
    rect(13,62,70,10,'#9dbe78')+[27,48,69].map((x,i)=>line(`M${x} 63V39`,'#6a9b6a',3)+circle(x,35,8,i===1?a:c)).join(''),
    rect(18,42,60,10,c)+rect(22,55,52,7,c)+line('M27 52V73M69 52V73','#776d62',5),
    rect(31,23,34,42,c)+circle(48,47,13,a)+line('M35 66V77M61 66V77','#766c61',4),
    rect(21,61,54,12,c)+path('M28 59Q48 41 68 59','#82cddd')+line('M48 53V21M48 26 38 41M48 26 58 41','#83cbdc',4),
    path('M20 63Q23 34 48 42L64 30 75 40 67 62Z','#8cbb7a')+circle(68,41,3,'#3d5454')+path('M29 43 36 30 43 42','#8cbb7a'),
    path('M35 63 29 35 48 12 67 35 61 63Z','#eff1e5')+path('M35 63 25 72 37 70M61 63 71 72 59 70',c)+circle(48,33,7,'#87c7d3'),
    path('M48 9 57 31 82 32 63 48 70 72 48 57 26 72 33 48 14 32 39 31Z',c),
    rect(43,24,10,51,c)+circle(48,30,8,a)+path('M48 26 48 8 57 25 48 30 77 29 56 36 48 30 48 58 39 35 48 30 19 29 40 24Z',a),
  ][Number(item.shape || 0) % 8];
  return svg(art,item.name);
}
