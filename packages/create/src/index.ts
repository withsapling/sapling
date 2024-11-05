import { intro, outro, text, select, isCancel } from '@clack/prompts';
import degit from "degit";
import { generateName } from './name-generator.ts';

const basicsRepo = "https://github.com/withsapling/examples/basics";
// const blogRepo = "https://github.com/withsapling/examples/blog";
// const marketingSiteRepo = "https://github.com/withsapling/examples/marketing-site";
// const portfolioRepo = "https://github.com/withsapling/examples/portfolio";
const helloWorldRepo = "https://github.com/withsapling/examples/single-file-hello-world";
const landingPageRepo = "https://github.com/withsapling/examples/single-file-landing-page";


// Export the init function so it can be called from other files
export async function init() {
  intro(`Welcome to Sapling 🌲`);

  const repo = await select({
    message: "Select a project to clone:",
    options: [
      { label: "The Basics (recommended)", value: basicsRepo },
      { label: "Hello World (blank)", value: helloWorldRepo },
      { label: "Landing Page (single file)", value: landingPageRepo },
    ],
  });

  if (isCancel(repo)) {
    outro('Operation cancelled');
    Deno.exit(0);
  }

  const suggestedName = generateName();

  const targetDir = await text({
    message: "Enter the project directory:",
    placeholder: `./${suggestedName}`,
    initialValue: `./${suggestedName}`,
  });

  if (isCancel(targetDir)) {
    outro('Operation cancelled');
    Deno.exit(0);
  }

  const emitter = await degit(repo, {
    force: true,
  });

  await emitter.clone(targetDir);

  const nextSteps = `Next steps: \n\n run deno run -A --watch index.ts`;

  outro(nextSteps);
}

// Add this to allow running directly from command line
if (import.meta.main) {
  await init();
}
