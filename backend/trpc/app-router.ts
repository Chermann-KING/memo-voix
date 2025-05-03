import { router } from "./trpc";
import { hiProcedure } from "./routes/example/hi/route";
import { transcribeProcedure } from "./routes/transcription/route";
import { authRouter } from "./routes/auth/route";
import { recordingRouter } from "./routes/recording/route";
import { folderRouter } from "./routes/folder/route";
import { collaborationRouter } from "./routes/collaboration/route";
import { commentRouter } from "./routes/comment/route";
import { settingsRouter } from "./routes/settings/route";

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  transcription: router({
    transcribe: transcribeProcedure,
  }),
  auth: authRouter,
  recording: recordingRouter,
  folder: folderRouter,
  collaboration: collaborationRouter,
  comment: commentRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
