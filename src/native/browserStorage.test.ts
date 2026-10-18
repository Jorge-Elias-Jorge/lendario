// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
afterEach(()=>{vi.restoreAllMocks();});
describe('preview storage fallback',()=>{
 it('preserves standalone browser access',async()=>{
  vi.resetModules();const {browserStorage,browserPersistenceAvailable}=await import('./browserStorage');
  browserStorage.setItem('test-key','saved');expect(browserStorage.getItem('test-key')).toBe('saved');
  expect(browserStorage.keys()).toContain('test-key');expect(browserPersistenceAvailable()).toBe(true);
  browserStorage.removeItem('test-key');expect(browserStorage.getItem('test-key')).toBeNull();
 });
 it('does not crash a sandbox with blocked storage',async()=>{
  vi.resetModules();vi.spyOn(window,'localStorage','get').mockImplementation(()=>{throw new DOMException('Sandbox','SecurityError');});
  const {browserStorage,browserPersistenceAvailable}=await import('./browserStorage');
  expect(browserPersistenceAvailable()).toBe(false);browserStorage.setItem('draft','temporary');
  expect(browserStorage.getItem('draft')).toBe('temporary');expect(browserStorage.keys()).toContain('draft');
  browserStorage.removeItem('draft');expect(browserStorage.getItem('draft')).toBeNull();
 });
 it('preserves an in-session draft if persistent storage is full',async()=>{
  vi.resetModules();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Quota','QuotaExceededError');});
  const {browserStorage,browserPersistenceAvailable}=await import('./browserStorage');
  browserStorage.setItem('full','session');expect(browserStorage.getItem('full')).toBe('session');
  expect(browserStorage.keys()).toContain('full');expect(browserPersistenceAvailable()).toBe(false);browserStorage.removeItem('full');
 });
});
