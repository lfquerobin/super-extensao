/* SPDX-License-Identifier: MPL-2.0 */
// Shared by the interface and worker. Keep old profiles readable for backup.
const supportedProviders = Object.freeze(["google-drive", "git"]);
const isSupportedProvider = (type) => supportedProviders.includes(type);
function assertSupportedProvider(type) {
  if (!isSupportedProvider(type)) throw new Error("SyncProviderDisabled");
}
module.exports = { supportedProviders, isSupportedProvider, assertSupportedProvider };
