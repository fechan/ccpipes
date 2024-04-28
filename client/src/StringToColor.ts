/**
 * Turn a string into a 6-digit hex color.
 * Adapted from https://stackoverflow.com/a/16348977
 * @param str String to turn into a color
 * @returns 6-digit hex color
 */
export const stringToColor = (str: string) => {
  let hash = 0;
  str.split('').forEach(char => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  })
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += value.toString(16).padStart(2, '0')
  }
  return color
}