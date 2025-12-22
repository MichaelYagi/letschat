/// <reference types="node" />
// Global type declarations for Node.js and Express

declare namespace NodeJS {
  interface Timeout {}
}

declare var process: {
  env: {
    [key: string]: string | undefined;
  };
  uptime: () => number;
  argv: string[];
  exit: (code?: number) => never;
};

declare var console: {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
};

declare var Buffer: {
  from(input: string | Uint8Array, encoding?: string): any;
};

declare var __dirname: string;

declare var setInterval: (callback: () => void, ms: number) => any;

// Module declarations
declare module 'crypto' {
  export function randomBytes(size: number): any;
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string): any;
  export function createCipheriv(algorithm: string, key: any, iv: any): any;
  export function createDecipheriv(algorithm: string, key: any, iv: any): any;
  export function timingSafeEqual(a: any, b: any): boolean;
  export function randomUUID(): string;
}

declare module 'fs' {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: any): void;
  export function unlinkSync(path: string): void;
  export function readFileSync(path: string, encoding: string): string;
  export function readdirSync(path: string): string[];
  export function createReadStream(path: string): any;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function basename(path: string, ext?: string): string;
  export function dirname(path: string): string;
  export function extname(path: string): string;
}

declare module 'http' {
  export function createServer(requestListener?: any): any;
}

declare module 'events' {
  export class EventEmitter {}
}

// Express types
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
      }
    }
  }
}

export {};
