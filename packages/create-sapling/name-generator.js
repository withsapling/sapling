const colors = [
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
  "hazel",
];

const trees = [
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
  "walnut",
];

export function generateName() {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomTree = trees[Math.floor(Math.random() * trees.length)];

  return `${randomColor}-${randomTree}`;
}
