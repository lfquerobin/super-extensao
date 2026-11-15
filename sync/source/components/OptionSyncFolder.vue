<!-- SPDX-License-Identifier: MPL-2.0 -->
<template>
  <div>
    <div>
      <div class="text-h6" role="heading" aria-level="3">
        {{ t("LabelLocaltarget") }}
      </div>
      <div class="caption">
        {{ t("DescriptionLocaltarget") }}
      </div>
      <SyncRadioGroup :value="mode" @input="mode = $event" column>
        <SyncRadio value="folder">
          <template #label>
            {{ t("LabelLocalfolder") }}
            <SyncTextField
              outlined
              dense
              :value="path" @input="path = $event"
              class="ms-2"
              readonly
              :aria-label="t('LabelLocalfolder')"
              @click="onTriggerFinder"
            >
              <template #append>
                <SyncIcon
                  color="blue darken-1"
                  aria-hidden="true"
                  @click="onTriggerFinder"
                >
                  mdi-folder
                </SyncIcon>
              </template>
            </SyncTextField>
          </template>
        </SyncRadio>
        <div class="caption ms-8 mb-6">
          {{ t("DescriptionLocalfolder") }}
        </div>
        <SyncRadio :label="t('LabelSyncTabs')" value="tabs" />
        <div class="caption ms-8 mb-2">
          {{ t("DescriptionSyncTabs") }}
        </div>
      </SyncRadioGroup>
    </div>
    <UiModal :value="finder" @input="finder = $event" :title="t('LabelLocalfolder')">
      <UiStack>
        <UiTitle>{{ t('LabelLocalfolder') }}</UiTitle>
        <UiAsyncState v-if="folderLoading" kind="loading" :text="t('UiFoldersLoading')" :progress="null" />
        <UiAsyncState v-else-if="folderError" kind="error" :text="t('UiFoldersFailed')" :retry="t('UiRetry')" @retry="onTriggerFinder" />
        <UiAsyncState v-else-if="!folders.length" kind="empty" :text="t('UiFoldersEmpty')" />
        <UiFolderTree v-else :value="selectedLocalRoot" @input="selectedLocalRoot = $event" :items="folders" :label="t('LabelLocalfolder')" :empty-label="t('LabelUntitledfolder')" />
        <UiActions class="ui-actions-end">
          <UiButton @click="finder = false">{{ t('LabelCancel') }}</UiButton>
          <UiButton class="ui-button-primary" :disabled="folderLoading || Boolean(folderError) || !selectedLocalRoot || !folders.length" @click="onSave">{{ t('LabelSave') }}</UiButton>
        </UiActions>
      </UiStack>
    </UiModal>
  </div>
</template>

<script>
import { isVivaldi } from "@sync-engine/browser/BrowserDetection";

export default {
  emits: ["input"],
  name: "OptionSyncFolder",
  props: { value: { type: String, default: undefined } },
  data() {
    return {
      selectedLocalRoot: this.value,
      path: "",
      mode: "folder",
      finder: false,
      folders: [],
      folderLoading: false,
      folderError: false,
      folderRevision: 0,
    };
  },
  watch: {
    value(localRoot) {
      this.selectedLocalRoot = this.value;
      this.updatePath();
    },
    mode() {
      if (this.mode === "tabs") {
        this.$emit("input", "tabs");
      }
      if (this.mode === "folder" && this.value === "tabs") {
        this.$emit("input", "");
      }
    },
  },
  beforeUnmount() {this.folderRevision++;},
  created() {
    this.updatePath();
  },
  methods: {
    async updatePath() {
      if (this.mode === "tabs" || this.value === "tabs") {
        this.mode = "tabs";
        return;
      }
      const BrowserTree = (await import("@sync-engine/browser/BrowserTree"))
        .default;
      if (this.value) {
        this.path =
          decodeURIComponent(await BrowserTree.getPathFromLocalId(this.value)) +
          "/";
      } else {
        this.path = this.t("LabelSelectfolder");
      }
    },
    async onTriggerFinder() {
      this.selectedLocalRoot = this.value === "tabs" ? "" : this.value;
      this.finder = true;
      const revision = ++this.folderRevision;
      this.folderLoading = true;
      this.folderError = false;
      try {
        const browser = (await import("@sync-engine/browser-api")).default;
        const folders = this.filterOutBookmarks((await isVivaldi()) ? await browser.bookmarks.getSubTree("1") : await browser.bookmarks.getTree());
        if (revision === this.folderRevision && this.finder) this.folders = folders;
      } catch {
        if (revision === this.folderRevision && this.finder) this.folderError = true;
      } finally {
        if (revision === this.folderRevision) this.folderLoading = false;
      }
    },
    filterOutBookmarks(children) {
      return children.filter((item) => {
        if (item.children) {
          item.children = this.filterOutBookmarks(item.children);
        }
        return !item.url;
      });
    },
    onUpdateSelection(active) {
      this.selectedLocalRoot = active[0];
    },
    onSave() {
      if (this.folderLoading || this.folderError || !this.selectedLocalRoot) return;
      this.finder = false;
      this.$emit("input", this.selectedLocalRoot);
    },
  },
};
</script>
