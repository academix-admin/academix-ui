# @academix/lottie-cache

A tiny in-memory **cache + preloader** for Lottie animation JSON, so the same
animation isn't fetched twice. Framework-agnostic — no React required.

## Install

```bash
npm install @academix/lottie-cache
```

## Usage

```ts
import { preloadLottie, getCachedLottie } from '@academix/lottie-cache';

// Preload (e.g. on app start or route hover):
const data = await preloadLottie('spinner', '/animations/spinner.json');

// Later, read synchronously from cache (null if not preloaded):
const cached = getCachedLottie('spinner');
```

## API

- `preloadLottie(id: string, src: string): Promise<any>` — fetch (if needed) and
  cache the animation JSON under `id`, returning it.
- `getCachedLottie(id: string): any | null` — synchronous cache read.

## License

MIT © Academix
