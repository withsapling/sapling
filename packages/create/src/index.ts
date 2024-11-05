import { intro, outro, text, select } from '@clack/prompts';
import degit from "degit";

const basicsRepo = "https://github.com/withsapling/examples/basics";
const helloWorldRepo = "https://github.com/withsapling/examples/single-file-hello-world";
const landingPageRepo = "https://github.com/withsapling/examples/single-file-landing-page";
// const simpleBlogRepo = "https://github.com/withsapling/examples/single-file/blog-0";

// Export the init function so it can be called from other files
export async function init() {
  intro(`Welcome to Sapling 🌲`);

  const repo = await select({
    message: "Select a project to clone:",
    options: [
      { label: "The Basics", value: basicsRepo },
      { label: "Hello World (blank)", value: helloWorldRepo },
      { label: "Landing Page (single file)", value: landingPageRepo },
    ],
  });

  const targetDir = await text({
    message: "Enter the target directory (default: current directory):",
    placeholder: ".",
    initialValue: ".",
  });

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
