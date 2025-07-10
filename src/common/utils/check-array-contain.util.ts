export function checkArrayContain<T>(A: T[], B: T[]): boolean {
  for (const item of B) {
    if (!A.includes(item)) {
      return false;
    }
  }
  return true;
}
