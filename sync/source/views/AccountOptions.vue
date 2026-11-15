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
      v-bind="data"
      @update:url="data.url = $event"
      @update:username="data.username = $event"
      @update:password="data.password = $event"
      @update:branch="data.branch = $event"
      @update:includeCredentials="data.includeCredentials = $event"
      @update:serverRoot="data.serverRoot = $event"
      @update:localRoot="data.localRoot = $event"
      @update:allowNetwork="data.allowNetwork = $event"
      @update:syncInterval="data.syncInterval = $event"
      @update:strategy="data.strategy = $event"
      @update:bookmark_file="data.bookmark_file = $event"
      @update:nestedSync="data.nestedSync = $event"
      @update:failsafe="data.failsafe = $event"
      @update:allowRedirects="data.allowRedirects = $event"
      @update:bookmark_file_type="data.bookmark_file_type = $event"
      @update:enabled="data.enabled = $event"
      @update:label="data.label = $event"
      @update:syncIntervalEnabled="data.syncIntervalEnabled = $event"
      @update:syncOnStartupEnabled="data.syncOnStartupEnabled = $event"
      @update:notifyOnly="data.notifyOnly = $event"
      @update:notificationsEnabled="data.notificationsEnabled = $event"
      @update:refreshToken="data.refreshToken = $event"
      @reset="onReset"
      @delete="onDelete"
    />
    <OptionsGoogleDrive
      v-if="data.type === 'google-drive'"
      v-bind="data"
      @update:url="data.url = $event"
      @update:username="data.username = $event"
      @update:password="data.password = $event"
      @update:branch="data.branch = $event"
      @update:includeCredentials="data.includeCredentials = $event"
      @update:serverRoot="data.serverRoot = $event"
      @update:localRoot="data.localRoot = $event"
      @update:allowNetwork="data.allowNetwork = $event"
      @update:syncInterval="data.syncInterval = $event"
      @update:strategy="data.strategy = $event"
      @update:bookmark_file="data.bookmark_file = $event"
      @update:nestedSync="data.nestedSync = $event"
      @update:failsafe="data.failsafe = $event"
      @update:allowRedirects="data.allowRedirects = $event"
      @update:bookmark_file_type="data.bookmark_file_type = $event"
      @update:enabled="data.enabled = $event"
      @update:label="data.label = $event"
      @update:syncIntervalEnabled="data.syncIntervalEnabled = $event"
      @update:syncOnStartupEnabled="data.syncOnStartupEnabled = $event"
      @update:notifyOnly="data.notifyOnly = $event"
      @update:notificationsEnabled="data.notificationsEnabled = $event"
      @update:refreshToken="data.refreshToken = $event"
      @reset="onReset"
      @delete="onDelete"
    />
  </SyncForm>
  <UiAsyncState v-if="supported" :kind="saving ? 'loading' : error ? 'error' : saved ? 'success' : ''"
    :text="saving ? t('UiWorking') : error || (saved ? t('UiSaved') : '')"
    :retry="error === t('UiAutoSaveFailed') ? t('UiRetry') : ''" @retry="autoSave.retry()" />
</section>
</template>
<script>
import { createAutoSave } from "../../../ui/autosave.js";
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
  },
  watch: {
    data: {
      deep: true, flush: 'post',
      async handler() {
        await this.$nextTick();
        if (!this.autoSave || this.deleted || this.loading || !this.supported) return;
        if (this.saved && !this.saving && !this.autoSave.error) {this.error = ''; return;}
        const form = this.$el.querySelector('form');
        if (form && !form.checkValidity()) { this.error = this.t('UiInvalidConfig'); return; }
        void this.autoSave.set(this.data);
      },
    },
    localRoot() {
      this.updateFolderName();
    },
    loading() {
      if (this.loading) return;
      this.savedData = JSON.stringify(this.$store.state.accounts[this.id].data);
      this.data = JSON.parse(this.savedData);
    },
  },
  created() {
    const id = this.id;
    this.autoSave = createAutoSave({
      write: data => this.$store.dispatch(actions.STORE_ACCOUNT, {id, data}),
      onState: state => {
        this.saving = state.saving;
        if (state.value) this.savedData = JSON.stringify(state.value);
        const form = this.$el?.querySelector?.('form');
        this.error = form && !form.checkValidity() && !this.saved ? this.t('UiInvalidConfig')
          : state.error ? this.t('UiAutoSaveFailed') : '';
      },
    });
    this.updateFolderName();
    if (!this.loading) {
      this.savedData = JSON.stringify(this.$store.state.accounts[this.id].data);
      this.data = JSON.parse(this.savedData);
    }
  },
  async beforeRouteLeave() {
    await this.$nextTick();
    await this.autoSave.flush();
    return this.deleted || this.saved || (!this.autoSave.error && !this.error);
  },
  methods: {
    async onDeleteUnsupported() {
      if (await confirmAction(document, this.t("SuperRemoveConfirm"))) await this.onDelete();
    },
    async updateFolderName() {
      const pathArray = PathHelper.pathToArray(
        decodeURIComponent(await BrowserTree.getPathFromLocalId(this.localRoot))
      );
      this.folderName = pathArray[pathArray.length - 1];
    },
    async onDelete() {
      this.deleted = true;
      await this.autoSave.flush();
      try {
        await this.$store.dispatch(actions.DELETE_ACCOUNT, this.id);
        this.$router.push("/");
      } catch (error) {
        this.deleted = false;
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
