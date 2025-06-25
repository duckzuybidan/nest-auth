import { IntersectionType } from '@nestjs/swagger';

type ClassType<T = any> = new (...args: any[]) => T;

export function mergeClasses<T extends ClassType[]>(...classes: T): ClassType {
  if (classes.length === 0) {
    throw new Error('mergeClasses requires at least one class');
  }

  if (classes.length === 1) {
    return classes[0];
  }

  return classes.reduce((acc, curr) => {
    return IntersectionType(acc, curr);
  }) as ClassType;
}
