<!-- SPDX-License-Identifier: MPL-2.0 -->
<template>
  <div>
    <div class="text-h6" role="heading" aria-level="3">
      {{ t("LabelPassphrase") }}
    </div>
    <div class="caption">
      {{ t("DescriptionPassphrase") }}
    </div>
    <template v-if="!editing">
      <template v-if="value">
        <SyncButton @click="beginEdit">
          <SyncIcon>mdi-pencil-lock</SyncIcon>{{ t("LabelChange") }}
        </SyncButton>
        <SyncButton @click="$emit('input', '')">
          <SyncIcon>mdi-lock-remove</SyncIcon>{{ t("LabelRemove") }}
        </SyncButton>
      </template>
      <template v-else>
        <SyncButton @click="beginEdit">
          <SyncIcon>mdi-lock-plus</SyncIcon>{{ t("LabelAdd") }}
        </SyncButton>
      </template>
    </template>
    <template v-else>
      <SyncTextField
        outlined
        dense
        class="mt-2"
        :value="passphrase"
        :label="t('LabelPassphrase')"
        :type="showPassphrase ? 'text' : 'password'"
        @input="passphrase = $event"
      >
        <template #append>
          <SyncIcon
            role="button"
            tabindex="0"
            :aria-label="
              showPassphrase ? t('LabelHidepassword') : t('LabelShowpassword')
            "
            @click="showPassphrase = !showPassphrase"
            @keydown.enter="showPassphrase = !showPassphrase"
            @keydown.space.prevent="showPassphrase = !showPassphrase"
          >
            {{ showPassphrase ? "mdi-eye" : "mdi-eye-off" }}
          </SyncIcon>
        </template>
      </SyncTextField>
      <SyncButton
        color="primary"
        @click="
          $emit('input', passphrase);
          passphrase = '';
          editing = false;
        "
      >
        <SyncIcon>mdi-check</SyncIcon>
        {{ t("LabelSave") }}
      </SyncButton>
      <SyncButton @click="passphrase = ''; editing = false">
        <SyncIcon>mdi-close</SyncIcon>
        {{ t("LabelCancel") }}
      </SyncButton>
    </template>
  </div>
</template>

<script>
export default {
  emits: ["input"],
  name: "OptionPassphrase",
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showPassphrase: false,
      editing: false,
      passphrase: "",
    };
  },
  methods: {
    beginEdit() { this.passphrase = ""; this.showPassphrase = false; this.editing = true; },
  },
};
</script>
