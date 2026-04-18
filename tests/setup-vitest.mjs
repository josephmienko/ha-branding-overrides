import { afterEach, beforeAll, beforeEach } from "vitest";

const rafTimers = new Set();

beforeAll(() => {
  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });

  window.requestAnimationFrame = (callback) => {
    const id = window.setTimeout(() => {
      rafTimers.delete(id);
      if (typeof document !== "undefined") {
        callback(Date.now());
      }
    }, 0);
    rafTimers.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    rafTimers.delete(id);
    window.clearTimeout(id);
  };
});

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  document.title = "";
});

afterEach(() => {
  return (async () => {
    for (let index = 0; index < 4; index += 1) {
      await Promise.resolve();
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    }
  })();
});
