/* Serial configuration writes: keep the latest change while a write is pending. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.SuperAutoSave = factory();
})(globalThis, function () {
  function createAutoSave({write, onState = () => {}}) {
    let pending, failed, running;
    let status = {saving: false, error: null, value: undefined};
    const report = update => { status = {...status, ...update}; onState(status); };
    async function drain() {
      while (pending) {
        const entry = pending;
        pending = undefined;
        try {
          await write(entry.value);
          failed = undefined;
          report({value: entry.value, error: null});
        } catch (error) {
          failed = entry;
          if (!pending) report({error});
        }
      }
      report({saving: false});
    }
    function start() {
      if (!running) {
        // Set running before invoking the writer; callbacks can enqueue changes.
        running = Promise.resolve().then(drain).finally(() => {
          running = undefined;
          if (pending) return start();
        });
      }
      return running;
    }
    return {
      set(value) {
        pending = {value: JSON.parse(JSON.stringify(value))};
        report({saving: true, error: null});
        return start();
      },
      retry() {
        if (failed && !pending) pending = failed;
        if (pending) {report({saving: true, error: null}); return start();}
        return running || Promise.resolve();
      },
      flush: () => running || Promise.resolve(),
      get error() {return status.error;},
    };
  }
  return {createAutoSave};
});
