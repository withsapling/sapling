import { intro as m, select as d, isCancel as i, outro as n, text as h } from "@clack/prompts";
import u from "degit";
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
], s = [
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
function g() {
  const e = l[Math.floor(Math.random() * l.length)], a = s[Math.floor(Math.random() * s.length)];
  return `${e}-${a}`;
}
const c = [
  {
    name: "Basics (recommended)",
    repo: "https://github.com/withsapling/examples/basics",
    outro: "npm run dev"
  },
  {
    name: "Hello World (blank)",
    repo: "https://github.com/withsapling/examples/single-file-hello-world",
    outro: "npm run dev"
  },
  {
    name: "Landing Page",
    repo: "https://github.com/withsapling/examples/single-file-landing-page",
    outro: "npm run dev"
  }
];
async function x() {
  m("Welcome to Sapling 🌲");
  const e = await d({
    message: "Select a project to clone:",
    options: c.map((t) => ({
      label: t.name,
      value: t.repo
    }))
  }), a = c.find((t) => t.repo === e);
  i(e) && (n("Operation cancelled"), Deno.exit(0));
  const r = g(), o = await h({
    message: "Enter the project directory:",
    placeholder: `./${r}`,
    initialValue: `./${r}`
  });
  i(o) && (n("Operation cancelled"), Deno.exit(0)), await (await u(e, {
    force: !0
  })).clone(o);
  const p = `Next steps:

 1. cd ${o}

 2. ${a?.outro}`;
  n(p);
}
export {
  x as default
};
