# Repository Guidelines

## Project Structure & Module Organization

This repository is a React 19 application built with TypeScript and Vite. Application code lives in `src/`: `main.tsx` mounts the app, `App.tsx` defines the main component, and the adjacent CSS files contain global and component styles. Import bundled images from `src/assets/`; place files that must be served unchanged, such as `favicon.svg` and `icons.svg`, in `public/`. Build and TypeScript configuration is kept in the repository root.

Keep new components small and colocate their styles and tests with the component when practical, for example `src/components/MapView/MapView.tsx` and `MapView.css`.

## Build, Test, and Development Commands

- `npm install` installs the exact dependency versions recorded in `package-lock.json`.
- `npm run dev` starts the Vite development server with hot module replacement.
- `npm run build` runs TypeScript project checks and creates the production bundle in `dist/`.
- `npm run lint` checks React and TypeScript code with Oxlint.
- `npm run preview` serves the production build locally for a final smoke test.

Run `npm run lint` and `npm run build` before submitting changes.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: two-space indentation, single quotes, no semicolons, and trailing commas in multiline structures. Use PascalCase for React components and their files, camelCase for functions and variables, and descriptive lowercase names for CSS classes. Prefer functional components and React hooks. Keep imports grouped at the top and remove unused code; TypeScript is configured to reject unused locals and parameters. Oxlint rules in `.oxlintrc.json` enforce hook correctness and safe component exports.

## Testing Guidelines

No automated test framework or coverage threshold is currently configured. Until one is added, validate changes with linting, a production build, and a browser smoke test through `npm run dev`. When introducing tests, add a documented `test` script and name files `*.test.ts` or `*.test.tsx` beside the code they cover.

## Commit & Pull Request Guidelines

Git history is unavailable in this workspace, so use concise, imperative commit subjects such as `Add map marker controls`. Keep commits focused. Pull requests should explain the change, list verification performed, link relevant issues, and include screenshots or recordings for visible UI changes. Call out new dependencies, configuration changes, and known follow-up work.
