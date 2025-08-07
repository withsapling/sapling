import Layout from "../layouts/Layout.js";

export function LoginPage() {
  return (
    <Layout>
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold mb-4">Welcome</h1>
          <div class="space-y-3">
            <a 
              href="/auth/google"
              class="inline-flex items-center px-4 py-2 border rounded bg-white hover:bg-gray-50 block w-full"
            >
              Sign in with Google
            </a>
            <a 
              href="/auth/github"
              class="inline-flex items-center px-4 py-2 border rounded bg-gray-900 text-white hover:bg-gray-800 block w-full"
            >
              Sign in with GitHub
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}