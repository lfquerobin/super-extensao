<!-- SPDX-License-Identifier: MPL-2.0 -->
<template>
<section class="sync-connections">
  <UiHeading class="sync-section-title">
    <div>
      <h2>{{ t("UiConnections") }}</h2>
      <p>{{ t("UiConnectionHelp") }}</p>
    </div>
  </UiHeading>
  <UiForm class="sync-form" @submit.prevent>
    <UiNotice class="ui-notice sync-notice">{{ t("SuperOAuthHelp") }}</UiNotice>
    <UiField
      >{{ t("SuperRedirect")
      }}<input
        :value="redirectUrl"
        readonly
        @focus="$event.target.select()"
        class="ui-control"
    /></UiField>
    <UiFieldset :disabled="loading || loadError">
      <legend>Google Drive</legend>
      <UiField
        >{{ t("SuperGoogleId")
        }}<input
          v-model.trim="oauth.googleClientId"
          autocomplete="off"
          class="ui-control"
      /></UiField>
      <UiField
        >{{ t("SuperGoogleSecret")
        }}<input
          v-model.trim="oauth.googleClientSecret"
          type="password"
          autocomplete="new-password"
          class="ui-control"
      /></UiField>
    </UiFieldset>
    <UiAsyncState :kind="error ? 'error' : loading ? 'loading' : ''" :text="error || t('UiWorking')" />
    <UiAsyncState :kind="saving ? 'loading' : saved ? 'success' : ''" :text="saving ? t('UiWorking') : saved ? t('UiSaved') : ''" />
    <UiButton v-if="error && !loading" @click="retry">{{ t('UiRetry') }}</UiButton>
  </UiForm>
</section>
</template>
<script>
import { createAutoSave } from "../../../ui/autosave.js";
import browser from "@sync-engine/browser-api";
export default {
  name: "Connections",
  data() {
    return {
      oauth: {
        googleClientId: "",
        googleClientSecret: "",
      },
      redirectUrl: chrome.identity.getRedirectURL(),
      saved: false,
      savedData: "",
      saving: false,
      loading: true,
      loadError: false,
      error: "",
    };
  },
  watch: {
    oauth: {
      deep: true, flush: 'post',
      handler() {
        if (this.loading || (!this.saving && !this.autoSave.error && JSON.stringify(this.oauth) === this.savedData)) return;
        this.saved = false;
        void this.autoSave.set(this.oauth);
      },
    },
  },
  async created() {
    this.autoSave = createAutoSave({
      write: oauthClients => browser.storage.local.set({oauthClients}),
      onState: state => {
        this.saving = state.saving;
        this.error = state.error ? this.t('UiAutoSaveFailed') : '';
        if (state.value) this.savedData = JSON.stringify(state.value);
        this.saved = !state.saving && !state.error && JSON.stringify(this.oauth) === this.savedData;
      },
    });
    await this.load();
  },
  methods: {
    retry() {return this.loadError ? this.load() : this.autoSave.retry();},
    async load() {
      this.loading = true; this.error = ''; this.loadError = false;
      try {
        const data = await browser.storage.local.get({oauthClients: {}});
        this.oauth = {...this.oauth, ...data.oauthClients};
        this.savedData = JSON.stringify(this.oauth);
      } catch {
        this.loadError = true;
        this.error = this.t('UiConnectionLoadFailed');
      } finally {this.loading = false;}
    },
  },
  async beforeRouteLeave() {
    await this.$nextTick();
    await this.autoSave.flush();
    return this.loadError || !this.error;
  },
};
</script>
