[![JSR](https://jsr.io/badges/@sapling/router)](https://jsr.io/@sapling/router)

# Sapling Router

A micro router for Sapling sites or Deno projects.

## Usage

```ts
import { Router } from "@sapling/router";

const router = new Router();

router.get("/", (c: Context) => {
  return c.json({ message: "Hello, world!" });
});
```
