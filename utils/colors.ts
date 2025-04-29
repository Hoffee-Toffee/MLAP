/*
Purple               #BA23F6
Pink                  #D916A8
Red                   #E81313
Orange             #CC4E00
Yellow               #FCCE14
Lime                 #7EAC11
Green               #008A0E
Teal                   #008573
Blue                  #1071E5
Lavender          #635DFF
Brown               #4D2800
White                #FFFFFF
Black                #000000
Gray                 #808080
*/

// V1 - Simple color palette
const white = '#FFFFFF';
const black = '#000000';

const originalColors = {
  purple: '#BA23F6',
  pink: '#D916A8',
  red: '#E81313',
  orange: '#CC4E00',
  yellow: '#FCCE14',
  lime: '#7EAC11',
  green: '#008A0E',
  teal: '#008573',
  blue: '#1071E5',
  lavender: '#635DFF',
  brown: '#4D2800',
  gray: '#808080',
};

const generateShades = (name: string, value: string) => ({
  // ~White to ~Original / 5 to 95
  ...Array.from({length: 20}, (_, i) => (i + 1) * 5).reduce((acc, shade) => {
    const shadeValue =
      shade === 100 ? value : mixColors(value, white, shade / 100);
    return {...acc, [`${name}-${shade}`]: shadeValue};
  }, {}),
  // Original
  [name]: value,
  // ~Original to ~Black / 105 to 195
  ...Array.from({length: 20}, (_, i) => (i + 1) * 5).reduce((acc, shade) => {
    const shadeValue =
      shade === 100 ? value : mixColors(black, value, shade / 100);
    return {...acc, [`${name}-${shade + 100}`]: shadeValue};
  }, {}),
});

const mixColors = (color1: string, color2: string, weight: number) => {
  // Mix the colors using the ratio provided

  // Converts each hex value to an integer, adds them together using the ratio
  const red =
    parseInt(color1.substring(1, 3), 16) * weight +
    parseInt(color2.substring(1, 3), 16) * (1 - weight);
  const green =
    parseInt(color1.substring(3, 5), 16) * weight +
    parseInt(color2.substring(3, 5), 16) * (1 - weight);
  const blue =
    parseInt(color1.substring(5, 7), 16) * weight +
    parseInt(color2.substring(5, 7), 16) * (1 - weight);

  // Converts the integers back to hex values (capitalized)
  const redHex = Math.round(red).toString(16).toUpperCase();
  const greenHex = Math.round(green).toString(16).toUpperCase();
  const blueHex = Math.round(blue).toString(16).toUpperCase();

  // Fixes the hex values that are only one character long (e.g. 0 instead of 00 or 9 instead of 09)
  // Adds the RGB values together with the # in front to make a hex color
  return (
    '#' +
    (redHex.length === 1 ? '0' + redHex : redHex) +
    (greenHex.length === 1 ? '0' + greenHex : greenHex) +
    (blueHex.length === 1 ? '0' + blueHex : blueHex)
  );
};

// From {col}-5 to {col}-95, with 5% increments for the almost white to almost original color
// Then just {col} for the original, and {col}-105 to {col}-195 for the almost original to almost black
const colors = Object.entries(originalColors).reduce(
  (acc, [key, value]) => ({...acc, ...generateShades(key, value)}),
  {},
);

export default colors;
