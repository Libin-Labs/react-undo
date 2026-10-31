import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement } from 'react';
import { setup } from './helpers.mjs';
import { useUndo } from '../dist/index.js';
let ui, api;
beforeEach(async () => (ui = await setup()));
afterEach(async () => ui.cleanup());
test('bounded history, redo invalidation and transaction rollback', async () => {
  function App() {
    api = useUndo(0, { limit: 2 });
    return null;
  }
  await ui.render(createElement(App));
  await act(() => {
    api.set(1);
    api.set(2);
    api.set(3);
  });
  assert.deepEqual(api.history.past, [1, 2]);
  await act(() => api.undo());
  assert.equal(api.value, 2);
  await act(() => api.redo());
  assert.equal(api.value, 3);
  await act(() => {
    api.beginBatch();
    api.set(4);
    api.set(5);
    api.endBatch();
  });
  await act(() => api.undo());
  assert.equal(api.value, 3);
  await act(() => {
    api.beginBatch();
    api.set(9);
    api.cancelBatch();
  });
  assert.equal(api.value, 3);
});
