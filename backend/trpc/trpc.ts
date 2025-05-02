import { initTRPC, TRPCError } from '@trpc/server';
import { TRPCContext } from './create-context';

// Initialize tRPC
const t = initTRPC.context<TRPCContext>().create();

// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      // Add the user to the context
      user: ctx.user,
    },
  });
});

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(isAuthed);