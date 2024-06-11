export const stringToColor = (string: string, saturation = 100, lightness = 25) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = 100 * hash
  return `hsl(${(hash % 360)}, ${saturation}%, ${lightness}%)`;
}