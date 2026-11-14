// The package ships `types.d.ts` without pointing `types` at it.
declare module 'mailchecker' {
  const mailchecker: {
    isValid(email: string): boolean;
    blacklist(): Set<string>;
  };
  export = mailchecker;
}
