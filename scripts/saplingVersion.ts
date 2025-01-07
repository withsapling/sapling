import { parseArgs } from "jsr:@std/cli";

const constantsPath = "packages/sapling/src/constants.ts";
const denoJsonPath = "packages/sapling/deno.json";

/**
 * Bumps the version of the Sapling library.
 *
 * @param {object} options - The options for bumping the version.
 * @param {boolean} [options.major] - Whether to bump the major version.
 * @param {boolean} [options.minor] - Whether to bump the minor version.
 * @returns {void}
 *
 * @example Major version bump (0.1.0 -> 1.0.0):
 * ```bash
 * deno run --allow-read --allow-write scripts/saplingVersion.ts --major
 * # or
 * deno run --allow-read --allow-write scripts/saplingVersion.ts -M
 * ```
 *
 * @example Minor version bump (0.1.0 -> 0.2.0):
 * ```bash
 * deno run --allow-read --allow-write scripts/saplingVersion.ts --minor
 * # or
 * deno run --allow-read --allow-write scripts/saplingVersion.ts -m
 * ```
 *
 * @example Patch version bump (0.1.0 -> 0.1.1):
 * ```bash
 * deno run --allow-read --allow-write scripts/saplingVersion.ts
 * ```
 */
function bumpVersion(options: { major?: boolean; minor?: boolean }): void {
  // Read the current version from constants.ts
  const constantsContent = Deno.readTextFileSync(constantsPath);
  const versionMatch = constantsContent.match(
    /export const SAPLING_VERSION = "(\d+)\.(\d+)\.(\d+)";/,
  );

  if (!versionMatch) {
    console.error("Could not find SAPLING_VERSION in constants.ts");
    process.exit(1);
  }

  let [major, minor, patch] = versionMatch.slice(1).map(Number);

  // Increment the appropriate version based on flags
  if (options.major) {
    major++;
    minor = 0;
    patch = 0;
  } else if (options.minor) {
    minor++;
    patch = 0;
  } else {
    patch++;
  }

  const newVersion = `${major}.${minor}.${patch}`;

  // Update constants.ts
  const updatedConstantsContent = constantsContent.replace(
    /export const SAPLING_VERSION = "(\d+)\.(\d+)\.(\d+)";/,
    `export const SAPLING_VERSION = "${newVersion}";`,
  );
  Deno.writeTextFileSync(constantsPath, updatedConstantsContent);

  // Update deno.json
  const denoJsonContent = Deno.readTextFileSync(denoJsonPath);
  const updatedDenoJsonContent = denoJsonContent.replace(
    /"version": "\d+\.\d+\.\d+"/,
    `"version": "${newVersion}"`,
  );
  Deno.writeTextFileSync(denoJsonPath, updatedDenoJsonContent);

  console.log(`Version bumped to ${newVersion}`);
}

const parsedArgs = parseArgs(Deno.args);

bumpVersion({
  major: parsedArgs['--major'] ?? false,
  minor: parsedArgs['--minor'] ?? false,
});
