import Layout from "../layouts/Layout.js";
import type { User } from "../db/schema.js";

interface HomeProps {
  sessionId?: string;
  user?: User;
}

export function Home({ sessionId, user }: HomeProps = {}) {
  return (
    <Layout user={user}>
      <main class="flex-1 flex flex-col justify-center items-center min-h-screen" >
        <h1 class="text-4xl font-bold font-heading leading-tight mb-8">Home</h1>
      </main>
    </Layout>
  );
}