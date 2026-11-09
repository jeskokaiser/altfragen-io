import { describe, expect, it } from 'vitest';
import { isShortcutBlocked } from './useTrainingKeyboard';

// A target whose closest() matches when the selector names one of `inside`.
const el = (...inside: string[]) => ({
  closest: (selector: string) =>
    inside.some((s) => selector.split(', ').some((part) => part.startsWith(s))) ? {} : null,
});
const key = (k: string, target: unknown, mods: Partial<KeyboardEvent> = {}) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: target as EventTarget,
  ...mods,
});

describe('isShortcutBlocked', () => {
  it('lets shortcuts through on the page itself', () => {
    expect(isShortcutBlocked(key('1', el()))).toBe(false);
    expect(isShortcutBlocked(key(' ', null))).toBe(false);
  });

  it('never takes Ctrl, Cmd or Alt combinations', () => {
    expect(isShortcutBlocked(key('c', el(), { ctrlKey: true }))).toBe(true);
    expect(isShortcutBlocked(key('c', el(), { metaKey: true }))).toBe(true);
  });

  it('stays out of fields, menus and dialogs', () => {
    expect(isShortcutBlocked(key('1', el('textarea')))).toBe(true);
    expect(isShortcutBlocked(key('1', el('[role="menu"]')))).toBe(true);
    expect(isShortcutBlocked(key('s', el('[role="dialog"]')))).toBe(true);
  });

  it('leaves Space on a focused button to the button, except on answer rows', () => {
    expect(isShortcutBlocked(key(' ', el('button')))).toBe(true);
    expect(isShortcutBlocked(key('1', el('button')))).toBe(false);
    expect(isShortcutBlocked(key(' ', el('button', '[data-training-answer]')))).toBe(false);
  });
});
