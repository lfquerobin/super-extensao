<!-- SPDX-License-Identifier: MPL-2.0 -->
<template>
  <div>
    <div class="text-h6" role="heading" aria-level="3">{{ t('LabelPassphrase') }}</div>
    <p class="caption">{{ t('DescriptionPassphrase') }}</p>
    <SyncTextField :value="value" :label="t('LabelPassphrase')" :type="showPassphrase ? 'text' : 'password'"
      autocomplete="new-password" @input="$emit('input', $event)">
      <template #append>
        <UiButton :aria-label="showPassphrase ? t('LabelHidepassword') : t('LabelShowpassword')"
          @click="showPassphrase = !showPassphrase">
          <SyncIcon aria-hidden="true">{{ showPassphrase ? 'mdi-eye' : 'mdi-eye-off' }}</SyncIcon>
        </UiButton>
      </template>
    </SyncTextField>
  </div>
</template>
<script>
export default {
  name: 'OptionPassphrase', emits: ['input'],
  props: {value: {type: String, required: true}},
  data: () => ({showPassphrase: false}),
};
</script>
