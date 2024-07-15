// index.ts
import { Bugprompt } from "./core/BugPrompt.js";
import Logger from "./core/Logger.js";

const bugprompt = Bugprompt.getInstance();
export { bugprompt as default, Logger };
