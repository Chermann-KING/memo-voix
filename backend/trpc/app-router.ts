import { router } from './trpc';
import { hiProcedure } from './routes/example/hi/route';
import { transcribeProcedure } from './routes/transcription/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  transcription: router({
    transcribe: transcribeProcedure,
  }),
});

export type AppRouter = typeof appRouter;