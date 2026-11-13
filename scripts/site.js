/**
 * One entry point for the local commands, so they behave the same on Windows, macOS and Linux.
 * package.json runs it; nothing here needs to be installed globally.
 *
 *   npm run build            node scripts/site.js build              fresh deployable site in _site/
 *   npm start                node scripts/site.js preview            preview at http://localhost:8080 (writes .preview/)
 *   npm run preview:samples  node scripts/site.js preview --samples  same, plus the sample events in src/samples/
 *   npm run admin            node scripts/site.js admin              preview plus the local admin at /admin/
 *
 * Safe to run again at any time: build always starts from an empty _site/, previews from an empty .preview/.
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Run Eleventy's own entry file with this same Node, so no shell or .cmd wrappers are involved.
const eleventyCli = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");

// The local CMS server, pinned. It is fetched by npm on first use instead of being a dependency, because only
// the local admin needs it: Netlify builds and the online admin never do. npm audit flags two of its
// dependencies (joi, zod); they are only reachable from this computer, and only while the admin is running.
const DECAP_SERVER = "decap-server@3.11.6";

const [command = "preview", ...flags] = process.argv.slice(2);
const children = [];
let stopping = false;

if (!existsSync(eleventyCli)) {
  console.error("Eleventy is not installed yet. Run `npm install` in this folder first.");
  process.exit(1);
}

/**
 * Start one tool and stop the others if it exits (for example, when a port is already in use).
 * `program` is a script file run with this Node, or { npx: "package@version" } to run a pinned npm package.
 */
function run(program, args, env) {
  const options = { cwd: root, stdio: "inherit", env: { ...process.env, ...env } };
  let child;
  if (typeof program === "string") {
    child = spawn(process.execPath, [program, ...args], options);
  } else if (process.env.npm_execpath) {
    // Started through `npm run`: call npm's own script with this Node (works on Windows, macOS and Linux).
    child = spawn(process.execPath, [process.env.npm_execpath, "exec", "--yes", program.npx, "--", ...args], options);
  } else {
    // Started with `node scripts/site.js` directly: let the shell find npx (npx.cmd on Windows).
    child = spawn("npx", ["--yes", program.npx, ...args], { ...options, shell: true });
  }
  children.push(child);
  child.on("exit", (code, signal) => {
    for (const other of children) if (other !== child && other.exitCode === null) other.kill();
    // Ctrl+C is a normal way to stop a preview, not an error.
    process.exitCode = stopping || signal ? 0 : (code ?? 0);
  });
  return child;
}

// Ctrl+C or closing the terminal: stop everything this script started.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    for (const child of children) if (child.exitCode === null) child.kill(signal);
  });
}

/** Delete a folder this script owns, but only inside the project. */
function emptyFolder(name) {
  const target = path.join(root, name);
  if (!target.startsWith(root + path.sep)) throw new Error(`Refusing to delete outside the project: ${target}`);
  rmSync(target, { recursive: true, force: true });
}

switch (command) {
  case "build": {
    // Start from an empty _site/ so deleted events and old preview files never reach a deploy.
    emptyFolder("_site");
    run(eleventyCli, [], { AQUABERRY_OUTPUT: "_site", SAMPLES: "" });
    break;
  }

  case "preview":
  case "admin": {
    emptyFolder(".preview");
    const samples = flags.includes("--samples");
    if (command === "admin") {
      // Local CMS server: reads and writes the files in this folder (MODE=fs, so Publish saves right away).
      // It has no password, so it must only listen on this computer: an empty BIND_HOST means localhost only,
      // even if a different value was set somewhere else.
      run({ npx: DECAP_SERVER }, [], { MODE: "fs", PORT: "8081", BIND_HOST: "" });
      console.log("\nAdmin: http://localhost:8080/admin/  (click Login: no password on your own computer)\n");
    }
    run(eleventyCli, ["--serve", "--port=8080"], { AQUABERRY_OUTPUT: ".preview", SAMPLES: samples ? "1" : "" });
    break;
  }

  default:
    console.error(`Unknown command "${command}". Use: build, preview, preview --samples or admin.`);
    process.exitCode = 1;
}
