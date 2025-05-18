export function shuffleArray<T>(array: T[]): T[] {
  const result = array.slice(); // shallow copy to avoid mutation

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // Make sure both indices are within bounds — this satisfies strict checks
    const temp: T = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }

  return result;
}
