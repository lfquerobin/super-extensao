<!-- SPDX-License-Identifier: MPL-2.0 -->
<template>
<SyncContainer class="sync-wizard">
  <UiCard as="section" class="options ui-wizard mt-3 mb-9">
    <UiSteps :steps="['UiProvider','UiName','UiAccess','UiFolder','UiDone'].map(name => t(name))" :current="currentStep" :label="t('UiNew')" />
    <div class="ui-wizard-body">
      <UiAsyncState v-if="createError" kind="error" :text="createError" />
      <UiWizardStep :active="currentStep === 0">
        <div class="headline" role="heading" aria-level="2">
          {{ t("LabelChooseadapter") }}
        </div>
        <p class="sync-wizard-help">{{ t("UiWizardHelp") }}</p>
        <div
          class="sync-service-grid"
          role="group"
          :aria-label="t('LabelChooseadapter')"
        >
          <UiButton
            v-for="a in adapters"
            :key="a.type"
            type="button"
            class="sync-service"
            :class="{ selected: adapter === a.type }"
            :aria-pressed="adapter === a.type"
            @click="adapter = a.type"
          >
            <span class="sync-service-heading"
              ><SyncIcon small aria-hidden="true">{{
                providerIcon(a.type)
              }}</SyncIcon
              ><strong>{{ providerName(a.type) }}</strong
              ><SyncIcon v-if="adapter === a.type" small aria-hidden="true"
                >mdi-check-circle</SyncIcon
              ></span
            ><span>{{ t("UiService" + a.type) }}</span>
          </UiButton>
        </div>
        <UiActions class="form-buttons flex-row-reverse justify-start">
          <SyncButton class="primary" @click="currentStep++">
            {{ t("LabelContinue") }}
          </SyncButton>
          <SyncButton
            :to="{ name: 'IMPORTEXPORT' }"
            :aria-label="t('LabelImportExport')"
            class="me-2"
          >
            <SyncIcon aria-hidden="true"> mdi-export </SyncIcon>
            <template v-if="isBrowser && true">
              {{ t("LabelImportExport") }}
            </template>
          </SyncButton>
        </UiActions>
      </UiWizardStep>

      <UiWizardStep :active="currentStep === 1">
        <div class="headline" role="heading" aria-level="2">
          {{ t("LabelAccountlabel") }}
        </div>
        <SyncForm>
          <SyncTextField
            outlined
            dense
            v-model="label"
            append-icon="mdi-label"
            class="mt-2 mb-4"
            :label="t('LabelAccountlabel')"
            :hint="t('DescriptionAccountlabel')"
            :persistent-hint="true"
            @keydown.enter.prevent="currentStep++"
          />
        </SyncForm>
        <UiActions class="form-buttons">
          <SyncButton @click="currentStep--">
            {{ t("LabelBack") }}
          </SyncButton>
          <SyncButton class="primary" @click="currentStep++">
            {{ t("LabelContinue") }}
          </SyncButton>
        </UiActions>
      </UiWizardStep>

      <UiWizardStep :active="currentStep === 2">

        <template v-if="adapter === 'git'">
          <div class="headline" role="heading" aria-level="2">
            {{ t("LabelServersetup") }}
          </div>
          <SyncForm>
            <SyncTextField
              outlined
              dense
              v-model="server"
              :rules="[validateUrl]"
              :label="t('LabelGiturl')"
            />
            <SyncTextField
              outlined
              dense
              v-model="username"
              :label="t('LabelUsername')"
            />
            <SyncTextField
              outlined
              dense
              v-model="password"
              :label="t('LabelPassword')"
              :type="showPassword ? 'text' : 'password'"
            >
              <template #append>
                <SyncIcon
                  role="button"
                  tabindex="0"
                  :aria-label="
                    showPassword
                      ? t('LabelHidepassword')
                      : t('LabelShowpassword')
                  "
                  @click="showPassword = !showPassword"
                  @keydown.enter="showPassword = !showPassword"
                  @keydown.space.prevent="showPassword = !showPassword"
                >
                  {{ showPassword ? "mdi-eye" : "mdi-eye-off" }}
                </SyncIcon>
              </template>
            </SyncTextField>
          </SyncForm>
          <UiActions class="form-buttons">
            <SyncButton @click="currentStep--">
              {{ t("LabelBack") }}
            </SyncButton>
            <SyncButton class="primary" @click="currentStep++">
              {{ t("LabelContinue") }}
            </SyncButton>
          </UiActions>
        </template>

        <template v-else-if="adapter === 'google-drive'">
          <div class="headline" role="heading" aria-level="2">
            {{ t("LabelGoogledrivesetup") }}
          </div>
          <SyncForm class="mt-2">
            <SyncAlert v-if="loginFlowError" dense color="error">
              {{ loginFlowError }}
            </SyncAlert>
            <SyncButton color="primary" @click="loginGoogleDrive">
              {{ t("LabelLogingoogle") }}
            </SyncButton>
            <p class="mt-2">
              {{ t("DescriptionLogingoogle") }}
            </p>
          </SyncForm>
          <UiActions class="form-buttons">
            <SyncButton @click="currentStep--">
              {{ t("LabelBack") }}
            </SyncButton>
          </UiActions>
        </template>

      </UiWizardStep>

      <UiWizardStep :active="currentStep === 3">
        <div class="headline" role="heading" aria-level="2">
          {{ t("LabelSyncfoldersetup") }}
        </div>
        <SyncForm>

          <template v-if="adapter === 'git'">
            <div class="text-h6" role="heading" aria-level="3">
              {{ t("LabelBookmarksfile") }}
            </div>
            <SyncTextField
              outlined
              dense
              v-model="bookmark_file"
              class="mb-2"
              append-icon="mdi-file-document"
              :rules="[validateBookmarksFile]"
              :label="t('LabelBookmarksfile')"
              :hint="t('DescriptionBookmarksfilegit')"
              :persistent-hint="true"
            />
            <OptionFileType v-model="bookmark_file_type" />
            <SyncTextField
              outlined
              dense
              v-model="branch"
              class="mb-2"
              :label="t('LabelGitbranch')"
            />
          </template>

          <template v-if="adapter === 'google-drive'">
            <div class="text-h6" role="heading" aria-level="3">
              {{ t("LabelBookmarksfile") }}
            </div>
            <SyncTextField
              outlined
              dense
              v-model="bookmark_file"
              append-icon="mdi-file-document"
              :rules="[validateBookmarksFileGoogle]"
              :label="t('LabelBookmarksfile')"
              :hint="t('DescriptionBookmarksfilegoogle')"
              :persistent-hint="true"
            />
            <SyncTextField
              outlined
              dense
              v-model="passphrase"
              :type="showPassphrase ? 'text' : 'password'"
              class="mt-2"
              :label="t('LabelPassphrase')"
              :hint="t('DescriptionPassphrase')"
              :persistent-hint="true"
            >
              <template #append>
                <SyncIcon
                  role="button"
                  tabindex="0"
                  :aria-label="
                    showPassphrase
                      ? t('LabelHidepassword')
                      : t('LabelShowpassword')
                  "
                  @click="showPassphrase = !showPassphrase"
                  @keydown.enter="showPassphrase = !showPassphrase"
                  @keydown.space.prevent="showPassphrase = !showPassphrase"
                >
                  {{ showPassphrase ? "mdi-eye" : "mdi-eye-off" }}
                </SyncIcon>
              </template>
            </SyncTextField>
          </template>

          <OptionSyncFolder v-if="isBrowser" v-model="localRoot" />
        </SyncForm>

        <UiActions class="form-buttons pt-4">
          <SyncButton @click="currentStep--">
            {{ t("LabelBack") }}
          </SyncButton>
          <SyncButton
            :disabled="isBrowser ? !localRoot : false"
            color="primary"
            @click="currentStep++"
          >
            {{ t("LabelContinue") }}
          </SyncButton>
        </UiActions>
      </UiWizardStep>

      <UiWizardStep :active="currentStep === 4">
        <div class="headline" role="heading" aria-level="2">
          {{ t("LabelSyncbehaviorsetup") }}
        </div>
        <SyncForm>
          <OptionAutoSync v-model="enabled" />
          <OptionSyncOnStartup v-model="syncOnStartupEnabled" />
          <template v-if="isBrowser">
            <OptionSyncIntervalEnabled v-model="syncIntervalEnabled" />
            <OptionSyncInterval
              v-if="syncIntervalEnabled"
              v-model="syncInterval"
            />
            <OptionNotifyOnly
              :notify-only.sync="notifyOnly"
              :notifications-enabled.sync="notificationsEnabled"
            />
          </template>
          <OptionSyncStrategy v-model="strategy" />
          <OptionNestedSync v-if="isBrowser" v-model="nestedSync" />
        </SyncForm>
        <UiActions class="form-buttons">
          <SyncButton @click="currentStep--">
            {{ t("LabelBack") }}
          </SyncButton>
          <SyncButton
            color="primary"
            :disabled="creating"
            :loading="creating"
            @click="onCreate()"
          >
            {{ t("LabelContinue") }}
          </SyncButton>
        </UiActions>
      </UiWizardStep>

      <UiWizardStep :active="currentStep === 5">
        <div class="headline" role="heading" aria-level="2">
          {{ t("LabelAccountcreated") }}
          <SyncIcon aria-hidden="true"> mdi-check </SyncIcon>
        </div>
        <SyncForm>
          <div v-if="isBrowser">
            {{ t("DescriptionAccountcreated") }}
            <router-link
              class="sync-button sync-primary ui-button ui-button-primary"
              to="/"
              >{{ t("UiProfiles") }}</router-link
            >
          </div>
        </SyncForm>
      </UiWizardStep>
    </div>
  </UiCard>
</SyncContainer>
</template>

<script>
/* globals IS_BROWSER */
import { actions } from "../store/definitions";
import OptionSyncFolder from "../components/OptionSyncFolder";
import OptionSyncInterval from "../components/OptionSyncInterval";
import OptionSyncStrategy from "../components/OptionSyncStrategy";
import OptionNestedSync from "../components/OptionNestedSync";
import OptionFileType from "../components/OptionFileType";
import OptionSyncIntervalEnabled from "../components/OptionSyncIntervalEnabled.vue";
import OptionAutoSync from "../components/OptionAutoSync.vue";
import OptionSyncOnStartup from "../components/OptionSyncOnStartup.vue";
import OptionNotifyOnly from "../components/OptionNotifyOnly.vue";

export default {
  name: "NewAccount",
  components: {
    OptionSyncOnStartup,
    OptionNotifyOnly,
    OptionAutoSync,
    OptionSyncIntervalEnabled,
    OptionFileType,
    OptionNestedSync,
    OptionSyncStrategy,
    OptionSyncInterval,
    OptionSyncFolder,
  },
  data() {
    return {
      currentStep: 0,
      creating: false,
      createError: "",
      loginFlowError: "",
      server: "https://",
      branch: "main",
      username: "",
      password: "",
      passphrase: "",
      refreshToken: "",
      bookmark_file: "bookmarks.xbel",
      bookmark_file_type: "xbel",
      localRoot: null,
      syncInterval: 15,
      strategy: "default",
      enabled: true,
      syncIntervalEnabled: IS_BROWSER,
      syncOnStartupEnabled: false,
      notifyOnly: false,
      notificationsEnabled: false,
      nestedSync: true,
      showPassword: false,
      showPassphrase: false,
      label: "",
      adapter: "google-drive",
      adapters: [
        { type: "google-drive", label: this.t("LabelAdaptergoogledrive"), description: this.t("DescriptionAdaptergoogledrive") },
        { type: "git", label: this.t("LabelAdaptergit"), description: this.t("DescriptionAdaptergit") },
      ],
    };
  },
  computed: {
    serverisNotHttps() {
      return !this.server.startsWith("https")
        ? this.t("DescriptionNonhttps")
        : "";
    },
  },
  backButton() {
    if (this.currentStep > 0) {
      this.currentStep--;
      return true;
    }
    this.$router.push({ name: "HOME" });
  },
  methods: {
    providerName(type) {
      return (
        {
          git: "Git",
          "google-drive": "Google Drive",
        }[type] || type
      );
    },
    providerIcon(type) {
      return (
        {
          "google-drive": "mdi-google-drive",
          git: "mdi-git",
        }[type] || "mdi-cloud-outline"
      );
    },
    async onCreate() {
      if (this.creating) return;
      this.creating = true;
      this.createError = "";
      try {
        const accountId = await this.$store.dispatch("CREATE_ACCOUNT", {
          type: this.adapter,
          url: this.server,
          username: this.username,
          password: this.password,
          enabled: this.enabled,
          syncIntervalEnabled: this.syncIntervalEnabled,
          syncOnStartupEnabled: this.syncOnStartupEnabled,
          notifyOnly: this.notifyOnly,
          notificationsEnabled: this.notificationsEnabled,
          label: this.label,
          ...(this.adapter === "git" && { branch: this.branch }),
          ...((this.adapter === "google-drive" ||
            this.adapter === "git") && { bookmark_file: this.bookmark_file }),
          ...((this.adapter === "google-drive" ||
            this.adapter === "git") && {
            bookmark_file_type: this.bookmark_file_type,
          }),
          ...(this.adapter === "google-drive" && {
            refreshToken: this.refreshToken,
          }),
          ...(this.passphrase && { passphrase: this.passphrase }),
          ...(this.adapter === "google-drive" &&
            this.passphrase && { password: this.passphrase }),
          ...(this.isBrowser && { localRoot: this.localRoot }),
          syncInterval: this.syncInterval,
          strategy: this.strategy,
          ...(this.isBrowser && { nestedSync: this.nestedSync }),
        });
        this.currentStep++;
        if (!this.isBrowser) {
          setTimeout(() => {
            this.$router.push({ name: "TREE", params: { accountId } });
            this.$store.dispatch(actions.TRIGGER_SYNC, accountId);
          }, 2000);
        }
      } catch (error) {
        this.createError = this.t(error.message) || String(error);
      } finally {
        this.creating = false;
      }
    },
    async loginGoogleDrive() {
      if (this.isBrowser) {
        await this.$store.dispatch(actions.REQUEST_NETWORK_PERMISSIONS);
      }
      const GoogleDriveAdapter = (
        await import("@sync-engine/adapters/GoogleDrive")
      ).default;
      try {
        const { refresh_token, username } =
          await GoogleDriveAdapter.authorize();
        if (refresh_token) {
          this.authorized = true;
          this.refreshToken = refresh_token;
          this.username = username;
          this.currentStep++;
        }
      } catch (e) {
        this.loginFlowError = e.message;
      }
    },
    validateUrl(str) {
      try {
        const u = new URL(str);
        return Boolean(u) && u.protocol.startsWith("http");
      } catch (e) {
        return false;
      }
    },
    validateBookmarksFile(path) {
      return path[0] !== "/" && path[path.length - 1] !== "/";
    },
    validateBookmarksFileGoogle(path) {
      return !path.includes("/");
    },
  },
};
</script>
