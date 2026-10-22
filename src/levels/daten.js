// Sockenpaare: [wartende Socke im Keller, verlorene Socke im Level, Farbe]
export const PAARE = {
  bad: [['Flossi', 'Flipper', '#5fb7e8'], ['Schaumi', 'Schäumchen', '#f2d35b'], ['Kalle', 'Kalla', '#3aa84a']],
  kuehlschrank: [['Frosti', 'Frostine', '#bfe8ff'], ['Butter', 'Brot', '#f5c842'], ['Eisbert', 'Eisbeth', '#9ad1e8']],
  herd: [['Glut', 'Glutine', '#ff8c3a'], ['Pfanni', 'Pfannkuchen', '#c87a3a'], ['Toasty', 'Toastine', '#e8b070']],
  kinderzimmer: [['Klötzchen', 'Klötzi', '#e8474c'], ['Bausi', 'Bausa', '#3b6fd8'], ['Tedda', 'Teddo', '#b87a45']],
  bett: [['Staubi', 'Stäubchen', '#9c94a8'], ['Dunkel', 'Dunkelinde', '#4a3a62'], ['Mümmel', 'Mümmelchen', '#c8a8d8']],
  garten: [['Windi', 'Windine', '#8fd3a0'], ['Grasi', 'Graso', '#5fae4a'], ['Sonni', 'Sonna', '#ffd25a']],
  aquarium: [['Blubb', 'Blubbine', '#4fa8e8'], ['Kiemi', 'Kiema', '#2fc0a0'], ['Perla', 'Perlo', '#f0e0ff']],
  winter: [['Flocki', 'Flocke', '#eaf4ff'], ['Rodel', 'Rodeline', '#e8474c'], ['Glühi', 'Glühwein', '#a8304a']],
};
export const KLAMMERN_NOETIG = { bad: 0, kuehlschrank: 4, herd: 9, kinderzimmer: 15, bett: 21, garten: 28, aquarium: 35, winter: 42, trommel: 50 };
export const LEVELNAMEN = { bad: 'Badewannen-Bucht', kuehlschrank: 'Kühlschrank-Gebirge', herd: 'Herdplatten-Vulkan', kinderzimmer: 'Klötzchen-Chaos', bett: 'Staubwüste', garten: 'Wäscheleinen-Höhen', aquarium: 'Aquarium-Tiefen', winter: 'Winter-Terrasse', trommel: 'In der Trommel' };
export const LEVEL_REIHENFOLGE = ['bad', 'kuehlschrank', 'herd', 'kinderzimmer', 'bett', 'garten', 'aquarium', 'winter'];
export const KLAMMERN_GESAMT = LEVEL_REIHENFOLGE.length * 7 + 2;
export const SOCKEN_GESAMT = LEVEL_REIHENFOLGE.length * 3;
