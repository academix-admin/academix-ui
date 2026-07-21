// Minimal ambient declaration so `process.env.NODE_ENV` type-checks without
// pulling in @types/node (this is a browser library). Bundlers/consumers
// replace `process.env.NODE_ENV` at build time.
declare const process: {
  env: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};
