const { execSync } = require("child_process");

const timestamp = new Date().toISOString();

function run(command, options = {}) {
  execSync(command, {
    stdio: "inherit",
    ...options
  });
}

function capture(command) {
  return execSync(command, {
    encoding: "utf8"
  });
}

console.log(`Starting automated deployment (${timestamp})`);
run("npx clasp push");

const versionOutput = capture(
  `npx clasp version "Auto deploy ${timestamp}"` // creates a new version
);

const match = versionOutput.match(/version\s+(\d+)/i);
const versionNumber = match && match[1];

if (!versionNumber) {
  throw new Error(
    `Unable to parse version number from clasp output:\n${versionOutput}`
  );
}

run(
  `npx clasp deploy --versionNumber ${versionNumber} --description "Auto deploy ${timestamp}"`
);
console.log("Deployment complete.");
