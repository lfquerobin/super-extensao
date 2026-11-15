/* SPDX-License-Identifier: MPL-2.0 */
import { h, mergeProps } from "vue";
import { asyncStateMarkup } from "./async-state.js";
import catalog from "./catalog.json";
import { installStructures } from "./vue-structures.js";

export function installUi(app) {
  installStructures(app);
  app.component("UiAsyncState", {
    inheritAttrs: false,
    props: { kind: String, text: String, detail: String, retry: String, disabled: Boolean, progress: { default: undefined } },
    emits: ["retry"],
    setup(props, { attrs, emit }) {
      return () => h("div", mergeProps(attrs, { innerHTML: asyncStateMarkup(props), onClick(event) {
        if (event.target.closest("button") && !props.disabled) emit("retry");
      } }));
    },
  });
  for (const [key, spec] of Object.entries(catalog)) {
    const name = "Ui" + key[0].toUpperCase() + key.slice(1);
    app.component(name, {
      inheritAttrs: false,
      setup(_props, { attrs, slots }) {
        return () => {
          const { as: variant, ...input } = attrs;
          const tag = variant || spec.tag;
          if (!(spec.tags || [spec.tag]).includes(tag)) throw Error(`Invalid tag for ${name}: ${tag}`);
          const data = mergeProps(spec.attrs || {}, input, { class: spec.class });
          if (tag !== "button") delete data.type;
          return h(tag, data, slots.default?.());
        };
      },
    });
  }
}
