import { Layout as SaplingLayout, type LayoutProps as SaplingLayoutProps, html } from "./index.ts";
import { defineConfig } from "npm:unocss";
import presetUno from "npm:@unocss/preset-uno";
import presetTypography from "npm:@unocss/preset-typography";

const config = defineConfig({
  presets: [presetUno(), presetTypography()],
});


function renderLogo() {
  return html`
    <div class="flex items-center space-x-2">
    <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
    <path d="M236.752 231.541L133.378 335.909C129.158 340.169 124.236 342.21 118.61 342.033C112.984 341.855 108.062 339.637 103.842 335.377C99.9747 331.117 97.953 326.147 97.7771 320.467C97.6013 314.787 99.6231 309.817 103.842 305.557L243.081 164.98C245.19 162.85 247.476 161.342 249.937 160.454C252.398 159.567 255.035 159.123 257.848 159.123C260.661 159.123 263.298 159.567 265.76 160.454C268.221 161.342 270.506 162.85 272.616 164.98L411.854 305.557C415.722 309.462 417.656 314.343 417.656 320.201C417.656 326.058 415.722 331.117 411.854 335.377C407.635 339.637 402.624 341.767 396.823 341.767C391.021 341.767 386.011 339.637 381.791 335.377L278.945 231.541V469.564C278.945 475.599 276.923 480.657 272.88 484.74C268.836 488.822 263.826 490.863 257.848 490.863C251.871 490.863 246.86 488.822 242.817 484.74C238.773 480.657 236.752 475.599 236.752 469.564V231.541Z" fill="currentColor"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M250.343 67.7635C253.467 64.6393 258.533 64.6393 261.657 67.7635L386.126 192.232C392.96 199.066 404.04 199.066 410.874 192.232C417.709 185.398 417.709 174.318 410.874 167.483L275.445 32.0546C264.706 21.3151 247.294 21.3152 236.555 32.0546L101.126 167.483C94.2915 174.318 94.2915 185.398 101.126 192.232C107.96 199.066 119.04 199.066 125.874 192.232L250.343 67.7635Z" fill="currentColor"/>
    </svg>
      <span class="text-xl font-bold">Sapling</span>
    </div>
  `;
}

function renderNav() {
  return html`
    <nav
      class="flex items-center justify-between px-6 md:px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-1000 max-w-1200px mx-auto @dark:bg-gray-900/80"
    >
      ${renderLogo()}
      <div>
        <a
          href="https://github.com/withsapling/sapling"
          class="bg-black text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2 group @dark:bg-white @dark:text-black @dark:hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          <iconify-icon icon="mdi:github" class="text-white @dark:text-black @dark:group-hover:text-white"></iconify-icon>
          <span>Star</span>
          <iconify-icon
            icon="material-symbols:north-east"
            class="text-white @dark:text-black @dark:group-hover:text-white @dark:hover:text-white"
          ></iconify-icon>
        </a>
      </div>
    </nav>
  `;
}

function FeatureCard({ title, description }: { title: string, description: string }) {
  return html`
    <div class="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all @dark:bg-gray-900/80 @dark:border-gray-800">
      <h3 class="text-2xl font-semibold mb-4">${title}</h3>
      <p class="text-lg text-gray-600 @dark:text-gray-400">${description}</p>
    </div>
  `;
}

export interface LayoutProps extends SaplingLayoutProps {
  title: string;
  description: string;
  hero?: {
    title: string;
    description: string;
  };
}

export default async function Layout(props: LayoutProps) {
  return await SaplingLayout({
    unoConfig: config,
    head: html`
        <title>${props.title}</title>
        <meta
          name="description"
          content="${props.description}"
        />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <script
          src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"
          defer
        ></script>
        <style>
          @keyframes gradient {
            0% {
              transform: rotate(0deg) scale(1.5);
            }
            100% {
              transform: rotate(360deg) scale(1.5);
            }
          }
          .hero-gradient {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
          }
          .hero-gradient::before {
            content: "";
            position: absolute;
            height: 150%;
            width: 150%;
            top: -25%;
            left: -25%;
            background: conic-gradient(
              from 0deg,
              rgba(255, 75, 69, 0.2),
              rgba(255, 167, 35, 0.2),
              rgba(71, 233, 198, 0.2),
              rgba(28, 232, 255, 0.2),
              rgba(75, 87, 255, 0.2),
              rgba(255, 75, 69, 0.2)
            );
            animation: gradient 20s linear infinite;
            z-index: -2;
          }
          .hero-gradient::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 1) 100%
            );
            z-index: -1;
          }
          @media (prefers-color-scheme: dark) {
            .hero-gradient::after {
              background: linear-gradient(
                to bottom,
                rgba(17, 24, 39, 0) 0%,
                rgba(17, 24, 39, 1) 100%
              );
            }
          }
          .mesh-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='mesh' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(0, 0, 0, 0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23mesh)'/%3E%3C/svg%3E");
            position: absolute;
            inset: 0;
            z-index: -1;
            opacity: 0.3;
          }
        </style>
      `,
    bodyClass: "text-gray-900 font-sans min-h-screen @dark:bg-gray-900 @dark:text-white",
    children: html`
        <div class="relative z-10">
          ${renderNav()}
          <main>
            <div
              class="relative h-[70vh] max-h-[600px] flex items-center justify-center px-6 pb-4 overflow-hidden hero-gradient"
            >
              <div class="mesh-pattern"></div>
              <div class="text-center max-w-3xl mx-auto">
                <h2 class="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                  ${props.hero?.title ?? "Stupid Simple Websites."}
                </h2>
                <p class="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
                  ${props.hero?.description ?? "We felt like modern web frameworks are often doing too much if you just want to build a simple, fast website. That's why we built Sapling."}
                </p>
                <div class="flex gap-4 justify-center">
                  <div
                    class="relative bg-gray-900 text-white pt-3 pb-3 pl-3 pr-2 rounded-lg font-medium flex items-center justify-between"
                  >
                    <span class="mr-2"
                      >› deno -A jsr:@sapling/create</span
                    >
                    <button
                      id="copy-button"
                      class="p-2"
                      aria-label="Copy command to clipboard"
                      onclick="copyToClipboard('deno -A jsr:@sapling/create')"
                    >
                      <iconify-icon
                        class="flex"
                        id="copy-icon"
                        icon="ic:baseline-content-copy"
                        style="color: white;"
                      ></iconify-icon>
                    </button>
                  </div>
                </div>
                <script>
                  function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(
                      () => {
                        const icon = document.getElementById("copy-icon");
                        icon.setAttribute("icon", "mdi:check");
                        setTimeout(() => {
                          icon.setAttribute("icon", "ic:baseline-content-copy");
                        }, 2000);
                      },
                      (err) => {
                        console.error("Could not copy text: ", err);
                      }
                    );
                  }
                </script>
              </div>
            </div>

            <!-- New Section -->
            <div class="py-8 px-4 text-center">
              <div class="max-w-4xl mx-auto">
                <h3 class="text-2xl font-semibold text-gray-800 @dark:text-white">
                  Don't believe us? This entire website is less than 300 lines of code in a single file.
                </h3>
                <a
                  href="https://dash.deno.com/playground/sapling-playground-0"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex mt-4 bg-black text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2 group @dark:bg-white @dark:text-black @dark:group-hover:text-white @dark:hover:text-white"
                >
                  <span>Open in Playground</span>
                  <iconify-icon
                    icon="material-symbols:north-east"
                    class="text-white @dark:text-black @dark:group-hover:text-white"
                  ></iconify-icon>
                </a>
              </div>
            </div>

            <div class="max-w-4xl mx-auto px-8 py-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                ${FeatureCard({
      title: "Zero JavaScript By Default 🙅‍♂️",
      description: "Just like Astro and 11ty, Sapling doesn't ship any JavaScript to your users. Just HTML, CSS, and JavaScript.",
    })}
                ${FeatureCard({
      title: "Lightning Fast ⚡️",
      description: "Built with performance in mind, Sapling delivers exceptional speed out of the box.",
    })}
                ${FeatureCard({
      title: "Modern 💻",
      description: "Write modern TypeScript, Tailwind CSS (via UnoCSS), and HTML. Sapling is SSR by default.",
    })}
                ${FeatureCard({
      title: "Scalable 📈",
      description: "Designed to scale from a single file (like this one) to a multi-page website.",
    })}
                ${FeatureCard({
      title: "Built for Deno 🦕",
      description: "We love Deno. We think it's the future of JavaScript and TypeScript so we built Sapling from the ground up for it.",
    })}
                ${FeatureCard({
      title: "No Lock-In 🔒",
      description: "We don't think you should be locked into one specific framework. If you want to switch to Astro, Next, Remix, etc. you can. Just take your HTML with Tailwind styles and go.",
    })}
              </div>
            </div>

            <footer class=" text-gray-900 py-12 @dark:bg-gray-900 @dark:text-white">
              <div class="max-w-4xl mx-auto px-8 text-center">
                <div class="flex justify-center space-x-4 mb-4">
                  <a
                    href="https://github.com/withsapling/sapling"
                    class="hover:text-gray-600"
                    aria-label="GitHub"
                  >
                    <iconify-icon icon="mdi:github" width="24"></iconify-icon>
                  </a>
                  <a href="#" class="hover:text-gray-600" aria-label="X">
                    <iconify-icon
                      icon="tabler:brand-x"
                      width="24"
                    ></iconify-icon>
                  </a>
                  <a href="#" class="hover:text-gray-600" aria-label="YouTube">
                    <iconify-icon icon="mdi:youtube" width="24"></iconify-icon>
                  </a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      `,
  });
}
