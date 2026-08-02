+++
title = "Javascript React"
date = 2026-06-09
updated= 2026-06-20
+++

See <https://github.com/alan2207/bulletproof-react/>.

EDIT: I never ended up using as I started using Svelte instead. See [SSR vs SPA](@/notes/20260620140537-ssr_vs_spa.md) for a topic related to both this and react.


## Imports {#imports}

Use absolute imports to avoid `../../../` imports

```jsonc
// Under jsconfig.json
"compilerOptions": {
   "baseUrl": ".",
   "paths": {
     "@/*": ["./src/*"]
   }
 }
// Or under tsconfig.json for typescript
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Then you can use absolute imports by prefixing using `@`.


## File Structure {#file-structure}

Something like the below should be fine

```sh
src/
  components/  # reusable components
  config/      # configuration of the app
  hooks/       # reusable hooks
  stores/      # state stores, sometimes called "context" instead
  utils/       # you know...
  types/       # shared types
  app/
    routes/       # application routes
    app.tsx       # app entrypoint
    router.tsx    # router config
```

I have seen some projects use `features/`, which contains specific and self-contained logic to implement some functionality

```sh
src/feature/feat/
  api/
  components/
  hooks/
  stores/
  types/
  utils/
```

This is basically just a local version of the global scope. I think this might be optional for smaller projects, and likely more common for larger React projects. Essentially features can call global components, but they can't call components from the other features.


## Component Libraries and Styling? {#component-libraries-and-styling}

Partial to Mankine, though Antlib and MUI are popular. There is a lot of opinionated stuff here, like tailwindcss, ShadCN, Radix UI and a lot more.

Anyways, for your own components make sure they don't grow too large. Extract to a standalone component if necessary. Sometimes I see pyramids of doom for the larger components...


## API {#api}

Use a single API client, don't create multiple instances. And when using APIs, define a function for it instead of just using calling the API on a spot. Store the function somewhere in the `api/` folder of the feature.

```js
export const getFood = (): Promise<{data: int}> => {
  return api.get('/food');
};
// And now do `getFood()` instead of `api.get('/food')`;
```

This is better for input validation and allows you to use something like \`react-query\` easier for caching data and other such shenanigans.


## State Management {#state-management}

Use `useState` for simpler cases while `useReducer` for more complicated states. Use [contexts](https://react.dev/learn/passing-data-deeply-with-context) and [hooks](https://react.dev/reference/react-dom/hooks) for managing application state (Redux toolkit seems reeeeally popular though). Use react-query for API cache.


## Errors {#errors}

API errors can be handled using interceptors, React errors can be handled using [error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).
