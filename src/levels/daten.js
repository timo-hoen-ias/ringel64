// Sockenpaare: [wartende Socke im Keller, verlorene Socke im Level, Farbe]
export const PAARE = {
  bad: [['Flossi', 'Flipper', '#5fb7e8'], ['Schaumi', 'Schäumchen', '#f2d35b'], ['Kalle', 'Kalla', '#3aa84a']],
  kuehlschrank: [['Frosti', 'Frostine', '#bfe8ff'], ['Butter', 'Brot', '#f5c842'], ['Eisbert', 'Eisbeth', '#9ad1e8']],
  herd: [['Glut', 'Glutine', '#ff8c3a'], ['Pfanni', 'Pfannkuchen', '#c87a3a'], ['Toasty', 'Toastine', '#e8b070']],
  kinderzimmer: [['Klötzchen', 'Klötzi', '#e8474c'], ['Bausi', 'Bausa', '#3b6fd8'], ['Tedda', 'Teddo', '#b87a45']],
  bett: [['Staubi', 'Stäubchen', '#9c94a8'], ['Dunkel', 'Dunkelinde', '#4a3a62'], ['Mümmel', 'Mümmelchen', '#c8a8d8']],
  garten: [['Windi', 'Windine', '#8fd3a0'], ['Grasi', 'Graso', '#5fae4a'], ['Sonni', 'Sonna', '#ffd25a']],
};
export const KLAMMERN_NOETIG = { bad: 0, kuehlschrank: 4, herd: 9, kinderzimmer: 15, bett: 21, garten: 28, trommel: 35 };
export const LEVELNAMEN = { bad: 'Badewannen-Bucht', kuehlschrank: 'Kühlschrank-Gebirge', herd: 'Herdplatten-Vulkan', kinderzimmer: 'Klötzchen-Chaos', bett: 'Staubwüste', garten: 'Wäscheleinen-Höhen', trommel: 'In der Trommel' };
export const LEVEL_REIHENFOLGE = ['bad', 'kuehlschrank', 'herd', 'kinderzimmer', 'bett', 'garten'];
