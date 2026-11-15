/* SPDX-License-Identifier: MPL-2.0 */
// Native controls for Vue 3. Profile and engine contracts remain value/input.
import { h, mergeProps, provide, inject, computed, getCurrentInstance } from "vue";
import catalog from "./catalog.json";
const radioGroup = Symbol("sync-radio-group");
const common = { value: null, label: String, hint: String, disabled: Boolean, readonly: Boolean };
const framing = { dense: Boolean, outlined: Boolean, small: Boolean, large: Boolean, color: String,
  persistentHint: Boolean, appendIcon: String, loading: Boolean };
function controlAttrs(attrs) {
  const { class: ignored, style, onClick, ...rest } = attrs;
  return rest;
}
function field(kind) {
  return {
    inheritAttrs: false,
    props: { ...common, ...framing, type: { default: "text" }, rules: { default: () => [] }, items: { default: () => [] },
      min: [String, Number], max: [String, Number], step: [String, Number], ticks: null, thumbLabel: null,
      errorMessages: null, inputValue: { default: undefined } },
    emits: ["input", "change"],
    mounted() { this.validate(); }, updated() { this.validate(); },
    methods: { validate() {
      const input = this.$refs.control;
      if (!input?.setCustomValidity) return;
      const failed = this.rules.map(rule => rule(this.value ?? "")).find(result => result !== true);
      const message = this.errorMessages || (typeof failed === "string" ? failed : failed === false ?
        (/^en/.test(document.documentElement.lang) ? "Invalid value" : "Valor inválido") : "");
      input.setCustomValidity([].concat(message).filter(Boolean).join(" "));
      input.setAttribute("aria-invalid", String(!input.validity.valid));
    } },
    render() {
      const toggle = kind === "checkbox" || kind === "switch", slider = kind === "range", select = kind === "select";
      const id = this.$attrs.id || "sync-field-" + this.$.uid;
      const input = { ...controlAttrs(this.$attrs), ref: "control", id, disabled: this.disabled || this.loading,
        readonly: this.readonly, class: toggle ? (kind === "switch" ? "ui-switch" : "ui-checkbox") : "ui-control", type: toggle ? "checkbox" : slider ? "range" : this.type,
        value: this.value ?? "", min: this.min, max: this.max, step: this.step,
        "aria-describedby": this.hint ? id + "-hint" : undefined };
      const update = event => {
        const value = toggle ? event.target.checked : slider ? Number(event.target.value) : select ?
          this.items[event.target.selectedIndex]?.value ?? event.target.value : event.target.value;
        this.$emit("input", value); this.$emit("change", value);
      };
      if (toggle) { input.checked = Boolean(this.inputValue ?? this.value); input.role = kind === "switch" ? "switch" : undefined; input.onChange = update; }
      else if (select) input.onChange = update;
      else input.onInput = update;
      const node = select ? h("select", input, this.items.map(item => h("option", { value: item.value }, item.text ?? item.label ?? item.value))) : h("input", input);
      return h("div", mergeProps({ class: ["sync-native-field", { "sync-native-toggle": toggle }], style: this.$attrs.style },
        { class: this.$attrs.class, onClick: this.$attrs.onClick }), [
        toggle ? h("label", { for: id, class: "ui-check" }, [node, h("span", this.label)]) : [
          this.label ? h("label", { for: id, class: "ui-field" }, this.label) : null,
          h("div", { class: "sync-native-input" }, [node, this.$slots.append?.()]),
        ],
        slider && this.$slots["thumb-label"] ? h("output", { for: id }, this.$slots["thumb-label"]({ value: this.value })) : null,
        this.hint ? h("small", { id: id + "-hint", class: "ui-note" }, this.hint) : null,
      ]);
    },
  };
}
export function installEngineUi(app) {
  for (const [name, kind] of Object.entries({ TextField: "input", Select: "select", Switch: "switch", Checkbox: "checkbox", Slider: "range" }))
    app.component("Sync" + name, field(kind));
  app.component("SyncRadioGroup", {
    props: { value: null, column: Boolean, disabled: Boolean }, emits: ["input", "change"],
    setup(props, { emit, slots }) {
      const uid = getCurrentInstance().uid;
      provide(radioGroup, { name: "sync-radios-" + uid, value: computed(() => props.value), disabled: computed(() => props.disabled),
        select(value) { emit("input", value); emit("change", value); } });
      return () => h("div", { class: "sync-radio-group", role: "radiogroup" }, slots.default?.());
    },
  });
  app.component("SyncRadio", {
    props: { value: null, label: String, disabled: Boolean },
    setup(props, { slots }) {
      const group = inject(radioGroup), uid = getCurrentInstance().uid, id = "sync-radio-" + uid;
      return () => h("div", { class: "sync-radio-option" }, [
        h("input", { type: "radio", value: String(props.value), class: "ui-radio", id, name: group.name, checked: group.value.value === props.value,
          disabled: props.disabled || group.disabled.value, "aria-labelledby": id + "-label", onChange: () => group.select(props.value) }),
        slots.label ? h("div", { id: id + "-label" }, slots.label()) : h("label", { for: id, id: id + "-label" }, props.label),
      ]);
    },
  });
  app.component("SyncButton", {
    inheritAttrs: false, props: { ...framing, disabled: Boolean, text: Boolean, to: [String, Object], type: { default: "button" } },
    setup(props, { attrs, slots }) {
      const properties = getCurrentInstance().appContext.config.globalProperties;
      return () => {
        const disabled = props.disabled || props.loading;
        const data = mergeProps(attrs, {
          class: [catalog.button.class, "sync-native-button", { "ui-button-primary": props.color === "primary" || String(attrs.class || "").includes("primary") }],
          "aria-busy": props.loading || undefined,
        });
        if (props.to) {
          const router = properties.$router;
          return h("a", mergeProps(data, { href: router.resolve(props.to).href, "aria-disabled": disabled || undefined,
            tabindex: disabled ? -1 : attrs.tabindex, onClick(event) {
              if (disabled) { event.preventDefault(); return; }
              if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || attrs.target === "_blank") return;
              event.preventDefault(); void router.push(props.to);
            } }), slots.default?.());
        }
        return h("button", mergeProps(data, { type: props.type, disabled }), slots.default?.());
      };
    },
  });
  app.component("SyncIcon", {
    inheritAttrs: false, props: { ...framing },
    setup(_props, { attrs, slots }) { return () => {
      const text = (slots.default?.() || []).map(node => typeof node.children === "string" ? node.children : "").join("").trim();
      return h("span", mergeProps(attrs, { class: ["mdi", text, "sync-native-icon"] }));
    }; },
  });
  for (const [name, tag, cls] of [
    ["Container", "div", "sync-container"], ["Row", "div", "sync-row"], ["Col", "div", "sync-col"],
    ["Card", "div", "ui-card ui-card-framed"], ["CardTitle", "div", "ui-title"], ["CardBody", "div", "ui-card-body"],
    ["CardActions", "div", "ui-actions"], ["Alert", "p", "ui-notice ui-notice-error"],
  ]) app.component("Sync" + name, { inheritAttrs: false, props: { ...framing }, setup(_props, { attrs, slots }) {
    return () => h(tag, mergeProps(attrs, { class: cls }), slots.default?.());
  } });
  app.component("SyncForm", { inheritAttrs: false, setup(_props, { attrs, slots }) {
    return () => h("form", mergeProps({ onSubmit: event => event.preventDefault() }, attrs, { class: "ui-form" }), slots.default?.());
  } });
}
