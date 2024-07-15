# BugSquash

BugSquash is a toolkit for auto-generating LLM prompts from code and bugs in Node.js projects to help speed-up AI-assisted development.

- BugSquash **generates documents** of predefined sets of code defined in a config file (`./bugsquash.json`) to speed up prompting.
- BugSquash reimplements **full stacktraces including source code** in Node.js, so we can show LLMs the actual code that failed.
- BugSquash also **outputs errors to a log file** (`./bugsquash.log`).

## Installation

```bash
npm install bugsquash
```

## Stack Tracing

```js
import bugprompt from "@synagi/nodejs-util/dist/index.js";

// enable bugsquash globally
bugprompt.enable();

// disable bugsquash globally
bugprompt.disable();
```

## Generating Code Docs

```json
  "scripts": {
    "docs": "node ./node_modules/@synagi/nodejs-util/dist/docgen/genDocs.js"
  }
```

## Sample Config

```json

```
