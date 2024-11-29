import { intro as g, select as m, isCancel as c, outro as l, text as f, spinner as w } from "@clack/prompts";
import y from "degit";
import { execSync as b } from "child_process";
const d = [
  "white",
  "black",
  "amber",
  "azure",
  "crimson",
  "emerald",
  "indigo",
  "jade",
  "maple",
  "ruby",
  "sapphire",
  "teal",
  "violet",
  "red",
  "sapphire",
  "hazel"
], u = [
  "aspen",
  "birch",
  "cedar",
  "elm",
  "maple",
  "oak",
  "pine",
  "redwood",
  "sequoia",
  "spruce",
  "willow",
  "cypress",
  "magnolia",
  "juniper",
  "sycamore",
  "beech",
  "hemlock",
  "poplar",
  "chestnut",
  "larch",
  "acacia",
  "alder",
  "ash",
  "eucalyptus",
  "fir",
  "hickory",
  "mahogany",
  "palm",
  "teak",
  "walnut"
];
function x() {
  const t = d[Math.floor(Math.random() * d.length)], n = u[Math.floor(Math.random() * u.length)];
  return `${t}-${n}`;
}
const h = [
  {
    name: "Basics (recommended)",
    repo: "https://github.com/withsapling/examples/node/basics",
    outro: "npm run dev"
  },
  {
    name: "Hello World",
    repo: "https://github.com/withsapling/examples/node/hello-sapling",
    outro: "npm run dev"
  }
], $ = (t, n, r = 12e4) => new Promise((o, i) => {
  const a = setTimeout(() => {
    i(new Error(`Operation timed out after ${r / 1e3} seconds`));
  }, r);
  try {
    const s = b(t, n);
    clearTimeout(a), o(s);
  } catch (s) {
    clearTimeout(a), i(s);
  }
});
async function T() {
  g("Welcome to Sapling 🌲");
  const t = await m({
    message: "Select a project to clone:",
    options: h.map((e) => ({
      label: e.name,
      value: e.repo
    }))
  }), n = h.find((e) => e.repo === t);
  c(t) && (l("Operation cancelled"), Deno.exit(0));
  const r = x(), o = await f({
    message: "Enter the project directory:",
    placeholder: `./${r}`,
    initialValue: `./${r}`
  });
  c(o) && (l("Operation cancelled"), Deno.exit(0)), await (await y(t, {
    force: !0
  })).clone(o);
  const a = await m({
    message: "Would you like to install dependencies?",
    options: [
      { label: "Yes", value: !0 },
      { label: "No", value: !1 }
    ]
  });
  if (c(a) && (l("Operation cancelled"), Deno.exit(0)), a) {
    const e = w();
    e.start("Installing dependencies...");
    try {
      await $(
        "npm install --no-audit",
        { cwd: o },
        12e4
      ), e.stop("Dependencies installed successfully");
    } catch (p) {
      e.stop("Failed to install dependencies"), p.message.includes("timed out") ? console.error(
        "Installation timed out after 120 seconds. Please try running 'npm install' manually."
      ) : console.error("Error details:", p);
    }
  }
  const s = `Next steps:

 1. cd ${o}

 2. ${a ? "" : `npm install

 3. `}${n?.outro}`;
  l(s);
}
export {
  T as default
};
