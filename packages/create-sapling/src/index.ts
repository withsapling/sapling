import { intro, outro, text, select, isCancel, spinner } from "@clack/prompts";
import degit from "degit";
import { generateName } from "./name-generator.ts";
import { templates } from "./templates.ts";
import { execSync } from "child_process";

// Helper function to execute a command with a timeout
const executeWithTimeout = (command, options, timeout = 120000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout / 1000} seconds`));
    }, timeout);

    try {
      const result = execSync(command, options);
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
};

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

  const installDeps = await select({
    message: "Would you like to install dependencies?",
    options: [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ],
  });

  if (isCancel(installDeps)) {
    outro("Operation cancelled");
    Deno.exit(0);
  }

  if (installDeps) {
    const s = spinner();
    s.start("Installing dependencies...");

    try {
      await executeWithTimeout(
        "npm install --no-audit",
        { cwd: targetDir },
        120000
      );
      s.stop("Dependencies installed successfully");
    } catch (error) {
      s.stop("Failed to install dependencies");
      if (error.message.includes("timed out")) {
        console.error(
          "Installation timed out after 120 seconds. Please try running 'npm install' manually."
        );
      } else {
        console.error("Error details:", error);
      }
    }
  }

  const nextSteps = `Next steps:\n\n 1. cd ${targetDir}\n\n 2. ${!installDeps ? "npm install\n\n 3. " : ""
    }${template?.outro}`;

  outro(nextSteps);
}
