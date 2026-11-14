import {openModal} from "./modal.js";

export function installStructures(Vue) {
  Vue.component("UiModal", {
    props: {value: Boolean, title: String},
    watch: {value() {this.$nextTick(this.syncModal);}},
    mounted() {this.syncModal();},
    beforeDestroy() {this.releaseModal?.();},
    methods: {
      syncModal() {
        if (this.value && !this.releaseModal) this.releaseModal = openModal(this.$refs.dialog, () => this.$emit("input", false));
        else if (!this.value && this.releaseModal) {this.releaseModal(); this.releaseModal = null;}
      },
    },
    render(h) {return h("dialog", {ref: "dialog", class: "ui-modal", attrs: {"aria-label": this.title}}, this.$slots.default);},
  });
  Vue.component("UiSteps", {
    functional: true,
    props: {steps: Array, current: Number, label: String},
    render(h, {props}) {
      return h("ol", {class: "ui-steps", attrs: {"aria-label": props.label}}, props.steps.map((step, index) => h("li", {
        class: {current: props.current === index, complete: props.current > index},
        attrs: {"aria-current": props.current === index ? "step" : null},
      }, [h("span", {attrs: {"aria-hidden": "true"}}, String(index + 1)), step])));
    },
  });
  Vue.component("UiWizardStep", {
    props: {active: Boolean},
    data() {return {visited: this.active};},
    watch: {active(value) {
      if (!value) return;
      this.visited = true;
      this.$nextTick(() => {
        const heading = this.$el.querySelector('h2,h3,[role="heading"]');
        if (heading) {heading.tabIndex = -1; heading.focus({preventScroll: true});}
      });
    }},
    render(h) {return h("section", {class: "ui-wizard-step", attrs: {hidden: !this.active}}, this.visited ? this.$slots.default : []);},
  });
  Vue.component("UiFolderTree", {
    props: {items: Array, value: String, label: String, emptyLabel: String, disabled: Boolean},
    render(h) {
      const branch = items => h("ul", items.filter(item => !item.url).map(item => {
        const title = item.title || this.emptyLabel;
        const children = (item.children || []).filter(child => !child.url);
        return h("li", {key: item.id, class: "ui-folder-node"}, [
          h("input", {class: "ui-radio ui-folder-select", attrs: {type: "radio", name: "ui-folder-" + this._uid, "aria-label": title, disabled: this.disabled},
            domProps: {checked: String(item.id) === this.value}, on: {change: () => this.$emit("input", String(item.id))}}),
          children.length ? h("details", {attrs: {open: items === this.items}}, [h("summary", title), branch(children)]) : h("span", {class: "ui-folder-title"}, title),
        ]);
      }));
      return h("div", {class: "ui-folder-tree", attrs: {role: "group", "aria-label": this.label}}, [branch(this.items || [])]);
    },
  });
}
