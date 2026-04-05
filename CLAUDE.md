# Code Style Rules

## React Components
- Always define explicit `interface` for component props — never inline prop types
- For optional/conditional JSX: use `let varName: ReactNode = undefined`, assign in an `if` block, then reference in the return — keeps the JSX clean
- Children rendered in a loop should be extracted into their own functional component
- No inline functions in JSX (e.g. `onClick={() => doThing(id)}`) — extract to a named handler or a child component
- Use `pnpm` (not npm) for package management

## Styling
- No large inline `style` blocks in JSX — use CSS classes in components.css instead
- Small one-off styles (1-2 properties) are okay inline, but anything more should be a class

## TypeScript
- Prefer explicit interfaces over inline type annotations
- Always use braces on `if` statements, even for single-line bodies
