'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}
export interface UndoOptions<T> {
  limit?: number;
  isEqual?: (a: T, b: T) => boolean;
  hotkeys?: boolean;
  scope?: RefObject<HTMLElement | null>;
}
export function useUndo<T>(
  initial: T,
  { limit = 100, isEqual = Object.is, hotkeys = false, scope }: UndoOptions<T> = {},
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000)
    throw new RangeError('History limit must be 1..10000.');
  const [history, setHistory] = useState<History<T>>({ past: [], present: initial, future: [] });
  const current = useRef(history);
  current.current = history;
  const batch = useRef<{
    history: History<T>;
    depth: number;
  } | null>(null);
  const apply = (next: History<T>) => {
    current.current = next;
    setHistory(next);
  };
  const set = (next: T | ((value: T) => T)) => {
    const old = current.current;
    const value = typeof next === 'function' ? (next as (value: T) => T)(old.present) : next;
    if (isEqual(old.present, value)) return;
    apply({
      past: batch.current ? old.past : [...old.past, old.present].slice(-limit),
      present: value,
      future: [],
    });
  };
  const undo = () => {
    if (batch.current) throw new Error('End or cancel the batch before undo.');
    const old = current.current;
    if (!old.past.length) return false;
    apply({
      past: old.past.slice(0, -1),
      present: old.past.at(-1)!,
      future: [old.present, ...old.future].slice(0, limit),
    });
    return true;
  };
  const redo = () => {
    if (batch.current) throw new Error('End or cancel the batch before redo.');
    const old = current.current;
    if (!old.future.length) return false;
    apply({
      past: [...old.past, old.present].slice(-limit),
      present: old.future[0]!,
      future: old.future.slice(1),
    });
    return true;
  };
  const beginBatch = () => {
    if (!batch.current) batch.current = { history: current.current, depth: 0 };
    if (batch.current.depth >= 100) throw new RangeError('Batch nesting limit exceeded.');
    batch.current.depth += 1;
  };
  const endBatch = () => {
    const active = batch.current;
    if (!active) return;
    active.depth -= 1;
    if (active.depth) return;
    batch.current = null;
    const now = current.current;
    if (!isEqual(active.history.present, now.present))
      apply({
        past: [...active.history.past, active.history.present].slice(-limit),
        present: now.present,
        future: [],
      });
    else apply(active.history);
  };
  const cancelBatch = () => {
    if (batch.current) {
      const saved = batch.current.history;
      batch.current = null;
      apply(saved);
    }
  };
  const callbacks = useRef({ undo, redo });
  callbacks.current = { undo, redo };
  useEffect(() => {
    if (!hotkeys) return;
    const target = scope?.current ?? document;
    const handler = (event: Event) => {
      const key = event as KeyboardEvent;
      const element = key.target as Element | null;
      if (
        key.defaultPrevented ||
        key.isComposing ||
        key.altKey ||
        !(key.ctrlKey || key.metaKey) ||
        element?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')
      )
        return;
      if (key.key.toLowerCase() === 'z') {
        key.preventDefault();
        if (key.shiftKey) callbacks.current.redo();
        else callbacks.current.undo();
      } else if (key.key.toLowerCase() === 'y') {
        key.preventDefault();
        callbacks.current.redo();
      }
    };
    target.addEventListener('keydown', handler);
    return () => target.removeEventListener('keydown', handler);
  }, [hotkeys, scope]);
  return {
    value: history.present,
    history,
    set,
    undo,
    redo,
    canUndo: !!history.past.length,
    canRedo: !!history.future.length,
    beginBatch,
    endBatch,
    cancelBatch,
    clear: () => {
      batch.current = null;
      apply({ past: [], present: current.current.present, future: [] });
    },
    reset: (value: T = initial) => {
      batch.current = null;
      apply({ past: [], present: value, future: [] });
    },
  };
}
export default useUndo;
