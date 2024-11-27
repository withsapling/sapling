import { intro, outro, text, select, isCancel } from "@clack/prompts";
import degit from "degit";
import { generateName } from "./name-generator.js";
import { templates } from "./templates.js";

// Export the init function so it can be called from other files
export default async function init() {
  intro(`Welcome to Sapling 🌲`);

  const repo = await select({
    message: "Select a project to clone:",
    options: templates.map((template) => ({
      label: template.name,
      value: template.repo,
    })),
  });

  const template = templates.find((template) => template.repo === repo);

  if (isCancel(repo)) {
    outro("Operation cancelled");
    Deno.exit(0);
  }

  const suggestedName = generateName();

  const targetDir = await text({
    message: "Enter the project directory:",
    placeholder: `./${suggestedName}`,
    initialValue: `./${suggestedName}`,
  });

  if (isCancel(targetDir)) {
    outro("Operation cancelled");
    Deno.exit(0);
  }

  const emitter = await degit(repo, {
    force: true,
  });

  await emitter.clone(targetDir);

  const nextSteps = `Next steps:\n\n 1. cd ${targetDir}\n\n 2. ${template?.outro}`;

  outro(nextSteps);
}
