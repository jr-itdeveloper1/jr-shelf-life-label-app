#!/usr/bin/env node

const fs = require("fs");

const rawTag = process.argv[2] || process.env.GITHUB_REF_NAME || "";
const match = rawTag.match(/^v(\d+)\.(\d+)\.(\d+)$/);

if (!match) {
  console.error(
    `Expected a release tag like v0.1.1, but received "${rawTag || "(empty)"}".`
  );
  process.exit(1);
}

const [, majorRaw, minorRaw, patchRaw] = match;
const major = Number(majorRaw);
const minor = Number(minorRaw);
const patch = Number(patchRaw);
const versionName = `${major}.${minor}.${patch}`;
const versionCode = major * 1000000 + minor * 1000 + patch;

if (versionCode <= 0) {
  console.error("Android versionCode must be greater than 0.");
  process.exit(1);
}

const output = {
  versionName,
  versionCode: String(versionCode),
};

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version_name=${output.versionName}\nversion_code=${output.versionCode}\n`
  );
}

console.log(JSON.stringify(output, null, 2));
