const path = require("node:path");

// Catch worker-only modules pulled into a page bundle and vice versa.
module.exports = function vpnContextLoader(source) {
  const directive = /^(['"])use (background|popup)\1/i.exec(source)?.[2];
  if (!directive) return source;

  const context = path.resolve(this.rootContext, "runtime/context/isInBackground");
  const wrongContext = directive === "background" ? "!isInBackground()" : "isInBackground()";
  const file = path.relative(this.rootContext, this.resourcePath).split(path.sep).join("/");
  const message = `VPN ${directive}-only module loaded in the wrong context: ${file}`;
  return `import { isInBackground } from ${JSON.stringify(context)};
if (${wrongContext}) throw new Error(${JSON.stringify(message)});
${source}`;
};
