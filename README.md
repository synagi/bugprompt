# BugPrompt

Generate docs from code for easier LLM prompting.

## Installation

```bash
npm install https://github.com/synagi/bugprompt.git
```

## Generating Code Docs

```json
  "scripts": {
    "docs": "node ./node_modules/@synagi/bugprompt/dist/genDocs.js"
  }
```

## Config Breakdown

The `bugprompt.json` config (auto-created in the root on first-use) lets you create sets of docs containing just the code you want:

- Create multiple docs with different sets of files levels of detail
- Set up templates for consistent doc styling
- Define what to include, exclude, and how to format
- Sanitize sensitive info via search/replace
- Optional stacktrace and logging (WIP so disbled for now)

### Example Config
```js
{
  "docs": {
    "outputDir": "bin/",            // output `bugprompt` subdir is create here, cleaned each time
    "templates": [
      {
        "name": "default",          // Template name
        "header": "# Source code\nBelow is the latest source code of the project, with each script given with its relative path to the project root.  Analyze all the code directly to understand its structure, flow and purpose:",
        "footer": ""                // Optional footer text for the document
      }
    ],
    "sanitize": [
      {
        "keyword": "<some private string>",    // Text to be replaced in all output docs
        "replace": "<redacted>"                // Replacement text
      }
    ],
    "documents": [                             // List of output docs to create
      {
        "fileName": "Project Code",            // Name of the output doc
        "minificationLevel": 0,                // 0: No minification, 1: Basic, 2: Aggressive
        "templateName": "default",             // Reference to a template defined above
        "content": [                           // Define sets of files to include in this doc
          {
            "title": "projectname",            // Title for this content block
            "description": "",                 // Optional description
            "headerPrefix": "##",              // Prefix for file headers in the document
            "root": "",                        // Root directory for file matching
            "include": [                       // File patterns to include
              "**/*.ts",
              "**/*.d.ts",
              "**/*.js",
              "**/*.cjs",
              "**/*.mjs",
              "**/*.tsx",
              "**/*.jsx"
            ],
            "exclude": [                       // File patterns to exclude
              "node_modules/**/*",
              "dist/**/*",
              "bin/**/*",
              "*.json",
              "*.log"
            ]
          }
        ]
      },
      {
        "fileName": "Project Code Min",
        "minificationLevel": 2,
        "content": [
          {
            "reference": "projectname",        // Inherets the content block titled "projectname"
            "headerPrefix": "// .",
            "useCodeblocks": false             // Don't wrap file contents in code blocks
          }
        ]
      },
      {
        "fileName": "Project Config",
        "minificationLevel": 1,
        "content": [
          {
            "reference": "projectname",
            "include": [
              "*.json"                         // Include only JSON files
            ],
            "exclude": [
              "package-lock.json"              // Exclude package-lock.json
            ]
          }
        ]
      }
    ]
  },
  "stacktrace": {
    "enabled": false                // Enable or disable stacktrace functionality
  },
  "log": {
    "enabled": false                // Enable or disable logging
  },
}
```
