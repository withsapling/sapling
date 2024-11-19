
export default async function Joke(req: Request) {
  const joke = await fetch("https://official-joke-api.appspot.com/random_joke");
  return joke;
}
