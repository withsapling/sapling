import { intro as m, select as d, isCancel as i, outro as r, text as h } from "@clack/prompts";
import u from "degit";
import { execSync as g } from "child_process";
const l = [
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
], c = [
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
function f() {
  const t = l[Math.floor(Math.random() * l.length)], a = c[Math.floor(Math.random() * c.length)];
  return `${t}-${a}`;
}
const s = [
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
];
async function $() {
  m("Welcome to Sapling 🌲");
  const t = await d({
    message: "Select a project to clone:",
    options: s.map((e) => ({
      label: e.name,
      value: e.repo
    }))
  }), a = s.find((e) => e.repo === t);
  i(t) && (r("Operation cancelled"), Deno.exit(0));
  const n = f(), o = await h({
    message: "Enter the project directory:",
    placeholder: `./${n}`,
    initialValue: `./${n}`
  });
  i(o) && (r("Operation cancelled"), Deno.exit(0)), await (await u(t, {
    force: !0
  })).clone(o);
  try {
    g("npm install", { cwd: o, stdio: "inherit" });
  } catch (e) {
    console.error("Failed to run npm install:", e);
  }
  const p = `Next steps:

 1. cd ${o}

 2. ${a?.outro}`;
  r(p);
}
export {
  $ as default
};
