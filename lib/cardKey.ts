export function cardKey(front: string, back: string): string {
  return btoa(unescape(encodeURIComponent(front + "||" + back)));
}
