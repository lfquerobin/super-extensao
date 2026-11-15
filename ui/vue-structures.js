import { h } from "vue";
import { openModal } from "./modal.js";

export function installStructures(app) {
  app.component("UiModal", {
    props: { value: Boolean, title: String }, emits: ["input"],
    watch: { value() { this.$nextTick(this.syncModal); } },
    mounted() { this.syncModal(); }, beforeUnmount() { this.releaseModal?.(); },
    methods: { syncModal() {
      if (this.value && !this.releaseModal) this.releaseModal = openModal(this.$refs.dialog, () => this.$emit("input", false));
      else if (!this.value && this.releaseModal) { this.releaseModal(); this.releaseModal = null; }
    } },
    render() { return h("dialog", { ref: "dialog", class: "ui-modal", "aria-label": this.title }, this.$slots.default?.()); },
  });
  app.component("UiSteps", {
    props: { steps: Array, current: Number, label: String },
    render() { return h("ol", { class: "ui-steps", "aria-label": this.label }, this.steps.map((step, index) => h("li", {
      class: { current: this.current === index, complete: this.current > index }, "aria-current": this.current === index ? "step" : null,
    }, [h("span", { "aria-hidden": "true" }, String(index + 1)), step]))); },
  });
  app.component("UiWizardStep", {
    props: { active: Boolean }, data() { return { visited: this.active }; },
    watch: { active(value) { if (!value) return; this.visited = true; this.$nextTick(() => {
      const heading = this.$el.querySelector('h2,h3,[role="heading"]');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }); } },
    render() { return h("section", { class: "ui-wizard-step", hidden: !this.active }, this.visited ? this.$slots.default?.() : []); },
  });
  app.component("UiFolderTree", {
    props: { items: Array, value: String, label: String, emptyLabel: String, disabled: Boolean }, emits: ["input"],
    render() {
      const branch = items => h("ul", items.filter(item => !item.url).map(item => {
        const title = item.title || this.emptyLabel, children = (item.children || []).filter(child => !child.url);
        return h("li", { key: item.id, class: "ui-folder-node" }, [
          h("input", { class: "ui-radio ui-folder-select", type: "radio", name: "ui-folder-" + this.$.uid,
            "aria-label": title, disabled: this.disabled, checked: String(item.id) === this.value, onChange: () => this.$emit("input", String(item.id)) }),
          children.length ? h("details", { open: items === this.items }, [h("summary", title), branch(children)]) : h("span", { class: "ui-folder-title" }, title),
        ]);
      }));
      return h("div", { class: "ui-folder-tree", role: "group", "aria-label": this.label }, [branch(this.items || [])]);
    },
  });
}
