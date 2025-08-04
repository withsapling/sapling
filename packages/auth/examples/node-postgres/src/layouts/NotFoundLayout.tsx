import Layout from "./Layout.js";


export default async function NotFoundLayout() {
  return (
    <Layout>
      <main
        class="flex-1 flex flex-col justify-center items-center min-h-screen"
      >
        <h1 class="text-4xl font-bold font-heading leading-tight mb-8">
          Page not found
        </h1>
      </main>
    </Layout>
  );
}