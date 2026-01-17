import { prisma } from './connection';

export const executeQueries = async (query: string[]) => {
  const executed = [];
  for (const q of query) {
    const res = await prisma.$queryRawUnsafe(q);
    executed.push(res);
  }

  return executed;
};
