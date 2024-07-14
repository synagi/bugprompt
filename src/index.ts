// index.ts
import { Bugprompt } from "./bugprompt.js";
import Logger from "./Logger.js";

const bugprompt = Bugprompt.getInstance();
export { bugprompt as default, Logger };
