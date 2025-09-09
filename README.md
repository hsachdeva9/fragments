# fragments

##  Getting Started

### 1. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/hsachdeva9/fragments
cd fragments
npm install
```

## Available Scripts

These scripts are defined in the `package.json` under `"scripts"`. 

### `npm run lint`

Runs ESLint to check for code style issues and errors in the `src/` directory.

```bash
npm run lint
```

*   Helps maintain clean and consistent code.


### `npm start`
Runs the server in normal mode (production-like environment).

```bash
npm start
```
*   Loads environment variables from your shell.
*   Does not automatically restart on file changes.
*   Use for stable environment execution

### `npm run dev`

Runs the server in development mode with automatic restarts when files change.

```bash
npm run dev
```
*   Loads environment variables from debug.env.
*   Uses --watch, so the server restarts on file changes.
*   Best for day-to-day development.

### `npm run debug`

Runs the server in debug mode with the Node.js debugger enabled.

```bash
npm run debug
```
*   Runs the server in debug mode with the Node.js debugger enable
*   Loads environment variables from debug.env. changes.
*   Restarts automatically on file changes.
*   Use this when you need to step through code with a debugger
