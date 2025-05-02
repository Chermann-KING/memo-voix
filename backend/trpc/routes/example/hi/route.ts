import { protectedProcedure } from '../../../trpc';

export const hiProcedure = protectedProcedure.query(({ ctx }) => {
  return {
    greeting: `Hello ${ctx.user.name}!`,
    timestamp: new Date().toISOString(),
  };
});