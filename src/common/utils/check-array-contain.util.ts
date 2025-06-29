export function checkArrayContain<T>(A: T[], B: T[]): boolean {
  for (let i = 0; i < B.length; i++) {
    if (!A.includes(B[i])) {
      return false;
    }
  }
  return true;
}
