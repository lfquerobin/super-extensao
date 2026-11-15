<!-- SPDX-License-Identifier: MPL-2.0 -->
<template>
<section class="sync-settings">
  <UiHeading class="sync-section-title">
    <div>
      <p class="sync-eyebrow">{{ data.type }}</p>
      <h2>{{ data.label || folderName || t("LabelOptions") }}</h2>
    </div>
    <router-link class="sync-button ui-button" to="/">{{
      t("LabelBack")
    }}</router-link>
  </UiHeading>
  <UiNotice
    v-if="error"
    role="alert"
    class="ui-notice sync-notice sync-error ui-notice-error"
  >
    {{ error }}
  </UiNotice>
  <p v-if="loading" role="status">{{ t("UiWorking") }}</p>
  <UiNotice v-if="!loading && !supported" kind="warning">{{ t("SyncProviderDisabled") }}</UiNotice>
  <UiButton v-if="!loading && !supported" @click="onDeleteUnsupported">{{ t("LabelRemoveaccount") }}</UiButton>
  <SyncForm v-if="!loading && supported" class="mt-3 mb-3">
    <OptionsGit
      v-if="data.type === 'git'"
      v-bind.sync="data"
      @reset="onReset"
      @delete="onDelete"
    />
    <OptionsGoogleDrive
      v-if="data.type === 'google-drive'"
      v-bind.sync="data"
      @reset="onReset"
      @delete="onDelete"
    />
  </SyncForm>
  <UiActions v-if="supported" class="sync-save-row">
    <span role="status" class="ui-inline-status">{{
      saved ? t("UiSaved") : ""
    }}</span
    ><UiButton
      class="sync-button sync-primary ui-button ui-button-primary"
      :disabled="loading || saving"
      @click="onSave"
     type="submit">
      {{ saving ? t("UiWorking") : t("LabelSave") }}
    </UiButton>
  </UiActions>
</section>
</template>
<script>
import { isSupportedProvider } from "../../providers.cjs";
import { confirmAction } from "../../../ui/confirmation.js";
import PathHelper from "@sync-engine/PathHelper";
import BrowserTree from "@sync-engine/browser/BrowserTree";
import { actions } from "../store/definitions";
import OptionsGoogleDrive from "../components/OptionsGoogleDrive";
import OptionsGit from "../components/OptionsGit.vue";

export default {
  name: "AccountOptions",
  components: {
    OptionsGit,
    OptionsGoogleDrive,
  },
  data() {
    return {
      folderName: "",
      data: {},
      savedData: false,
      error: "",
      saving: false,
      deleted: false,
    };
  },
  computed: {
    supported() { return isSupportedProvider(this.data.type); },
    id() {
      return this.$route.params.accountId;
    },
    loading() {
      return (
        !this.$store.state.accounts[this.id] ||
        !this.$store.state.accounts[this.id].data ||
        !Object.keys(this.$store.state.accounts[this.id].data).length
      );
    },
    localRoot() {
      return this.data ? this.data.localRoot : null;
    },
    saved() {
      return this.savedData === JSON.stringify(this.data);
    },
    menuComponent() {
      return this.$vuetify.breakpoint.mobile ? "v-navigation-drawer" : "div";
    },
  },
  watch: {
    localRoot() {
      this.updateFolderName();
    },
    loading() {
      if (this.loading) return;
      this.data = JSON.parse(
        JSON.stringify(this.$store.state.accounts[this.id].data)
      );
    },
  },
  created() {
    this.updateFolderName();
    if (!this.loading) {
      this.data = JSON.parse(
        JSON.stringify(this.$store.state.accounts[this.id].data)
      );
    }
  },
  methods: {
    async onDeleteUnsupported() {
      if (await confirmAction(document, this.t("SuperRemoveConfirm"))) await this.onDelete();
    },
    async onSave() {
      this.saving = true;
      this.error = "";
      try {
        await this.$store.dispatch(actions.STORE_ACCOUNT, {
          id: this.id,
          data: JSON.parse(JSON.stringify(this.data)),
        });
        this.savedData = JSON.stringify(this.data);
      } catch (error) {
        this.error = error.message || String(error);
      } finally {
        this.saving = false;
      }
    },
    async updateFolderName() {
      const pathArray = PathHelper.pathToArray(
        decodeURIComponent(await BrowserTree.getPathFromLocalId(this.localRoot))
      );
      this.folderName = pathArray[pathArray.length - 1];
    },
    async onDelete() {
      try {
        await this.$store.dispatch(actions.DELETE_ACCOUNT, this.id);
        this.$router.push("/");
      } catch (error) {
        this.error = error.message || String(error);
      }
    },
    async onReset() {
      try {
        await this.$store.dispatch(actions.RESET_ACCOUNT, this.id);
      } catch (error) {
        this.error = error.message || String(error);
      }
    },
  },
};
</script>
