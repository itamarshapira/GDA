// Minimal hook/JSX harness using existing Babel; no test dependencies installed.
// Effects run after render, state is retained, and replay simulates StrictMode.
// This is not a native renderer, so layout/native behavior still needs a phone.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");

function load(relative, mocks, globals = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename, configFile: false, babelrc: false,
    plugins: ["@babel/plugin-transform-react-jsx", "@babel/plugin-transform-modules-commonjs"],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", ...Object.keys(globals), code)(
    name => {
      assert(Object.hasOwn(mocks, name), `Unexpected import: ${name}`);
      return mocks[name];
    }, module, module.exports, ...Object.values(globals),
  );
  return module.exports;
}

function hooks() {
  const slots = [], effects = [];
  let index = 0, pending = [], invoke;
  const useEffect = (effect, deps) => {
    const i = index++;
    const old = slots[i];
    if (!old || !deps || deps.some((value, n) => value !== old.deps[n])) {
      pending.push(() => {
        old?.cleanup?.();
        const entry = { deps, effect, cleanup: effect() };
        slots[i] = entry;
        effects[i] = entry;
      });
    }
  };
  const react = {
    useRef: value => slots[index++] ||= { current: value },
    useState: initial => {
      const i = index++;
      if (!slots[i]) slots[i] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[i].value, value => {
        slots[i].value = typeof value === "function" ? value(slots[i].value) : value;
      }];
    },
    useEffect, useLayoutEffect: useEffect,
    useImperativeHandle: (ref, create) => { ref.current = create(); },
    forwardRef: component => component,
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat() }),
  };
  return {
    react,
    render: fn => {
      if (fn) invoke = fn;
      index = 0;
      pending = [];
      const result = invoke();
      pending.forEach(effect => effect());
      return result;
    },
    replay: () => { effects.forEach(entry => entry?.cleanup?.()); effects.forEach(entry => { if (entry) entry.cleanup = entry.effect(); }); },
    unmount: () => effects.forEach(entry => entry?.cleanup?.()),
  };
}

function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}
const flush = async () => { for (let i = 0; i < 25; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
module.exports = { load, hooks, find, flush, deferred };
