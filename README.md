# @lp-labs/react-undo

Bounded immutable undo/redo history with transaction batching. React 18+ peer only; no runtime dependencies. Includes ESM, CommonJS and generated TypeScript declarations.

## Installation

```sh
npm install @lp-labs/react-undo
```

## Quick Start

```jsx
import { useUndo } from '@lp-labs/react-undo';
export default function Example() {
  const history = useUndo(0, { limit: 100 });
  return (
    <>
      <output>{history.value}</output>
      <button onClick={() => history.set((value) => value + 1)}>Increment</button>
      <button disabled={!history.canUndo} onClick={history.undo}>
        Undo
      </button>
      <button disabled={!history.canRedo} onClick={history.redo}>
        Redo
      </button>
    </>
  );
}
```

## API

`useUndo(initial, {limit=100,isEqual=Object.is,hotkeys=false,scope})` returns `value`, `history`, `set(valueOrUpdater)`, `undo()`, `redo()`, `canUndo`, `canRedo`, `clear()`, `reset(value?)`, `beginBatch()`, `endBatch()` and `cancelBatch()`. Batches can nest; only the outer commit adds a history entry. Undo/redo during a batch throw. New edits invalidate redo. `clear` preserves the present value; reset discards history. Optional Ctrl/Cmd+Z, Shift+Z and Ctrl/Cmd+Y ignore editable targets. `scope` restricts the listener to a referenced element.

## Benefits

| Area               | Details                                       |
| ------------------ | --------------------------------------------- |
| Memory bounded     | Limit retained history entries.               |
| Batchable changes  | Group a transaction into one undo step.       |
| Optional shortcuts | Install scoped shortcuts only when requested. |

## Customization

| Area         | Details                                               |
| ------------ | ----------------------------------------------------- |
| History      | Set depth and a custom equality function.             |
| Transactions | Begin/end nested batches or cancel the current batch. |
| Keyboard     | Opt into shortcuts and an element scope.              |

## Security And Limits

History length is 1..10,000 (default100), with at most100 nested batches. Snapshots are references, not deep clones: use immutable values. Large snapshots still consume memory. Do not retain passwords or secrets in history. Keyboard integration is opt-in. No collaborative history, persistence or automatic application transaction rollback is provided. SSR uses initial state without browser access.

## Support

[Donate via PayPal](https://www.paypal.me/LibinPrasanth). Author: [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).

## License

MIT License. See the packaged [LICENSE](LICENSE) file.
