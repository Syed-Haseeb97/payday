import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

// Read-only repo-state checks. Only existsSync / readFileSync / readdirSync /
// statSync and JSON.parse are used. Nothing is written, deleted, or spawned.

const root = process.cwd();
const at = (first: string, ...rest: unknown[]) =>
  path.join(root, first, ...rest.filter((s): s is string => typeof s === "string"));

type Pkg = { scripts?: Record<string, string>; dependencies?: Record<string, string> };

function readPkg(): Pkg {
  return JSON.parse(fs.readFileSync(at("package.json"), "utf8")) as Pkg;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const SECRET_RE = /sk_live_|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/;

describe("required top-level files", () => {
  it("all required top-level files exist", () => {
    const required = [
      "package.json",
      "tsconfig.json",
      "README.md",
      "AGENTS.md",
      "PRODUCT_BRIEF.md",
      "eslint.config.mjs",
      "next.config.ts",
      "vitest.config.ts",
    ];
    const missing = required.filter((f) => !fs.existsSync(at(f)));
    expect(missing).toEqual([]);
  });
});

describe("package.json", () => {
  it("parses as JSON", () => {
    expect(() => readPkg()).not.toThrow();
  });

  it("declares dev, build, start, lint and test scripts", () => {
    const scripts = readPkg().scripts ?? {};
    for (const name of ["dev", "build", "start", "lint", "test"]) {
      expect(scripts, `missing script "${name}"`).toHaveProperty(name);
    }
  });

  it("every scripts/*.ts file referenced in scripts exists on disk", () => {
    const scripts = readPkg().scripts ?? {};
    const referenced = new Set<string>();
    for (const cmd of Object.values(scripts)) {
      for (const m of cmd.matchAll(/scripts[\\/]\S+?\.ts\b/g)) referenced.add(m[0]);
    }
    const missing = [...referenced].filter((f) => !fs.existsSync(at(f)));
    expect(missing).toEqual([]);
  });
});

describe("tsconfig.json", () => {
  it("parses after stripping comments and has compilerOptions", () => {
    const raw = fs.readFileSync(at("tsconfig.json"), "utf8");
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const parsed = JSON.parse(stripped) as { compilerOptions?: unknown };
    expect(typeof parsed.compilerOptions).toBe("object");
    expect(parsed.compilerOptions).not.toBeNull();
  });
});

describe("app routes", () => {
  it("app/ exists and contains at least one page.tsx or route.ts", () => {
    expect(fs.existsSync(at("app"))).toBe(true);
    const hasRoute = walk(at("app")).some((f) => {
      const base = path.basename(f);
      return base === "page.tsx" || base === "route.ts";
    });
    expect(hasRoute).toBe(true);
  });
});

describe("colocated tests", () => {
  it("every .test.ts/.test.tsx under lib/ and components/ is non-empty", () => {
    const testFiles = [...walk(at("lib")), ...walk(at("components"))].filter((f) =>
      /\.test\.tsx?$/.test(f),
    );
    const empty = testFiles.filter((f) => fs.statSync(f).size === 0);
    expect(empty.map((f) => path.relative(root, f))).toEqual([]);
  });
});

describe("source hygiene", () => {
  it("no merge-conflict markers in .ts/.tsx/.md under app, lib, components, scripts", () => {
    const dirs = ["app", "lib", "components", "scripts"].map(at);
    const files = dirs.flatMap(walk).filter((f) => /\.(ts|tsx|md)$/.test(f));
    const hits: string[] = [];
    for (const f of files) {
      fs.readFileSync(f, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (line.startsWith("<<<<<<< ") || line === "=======" || line.startsWith(">>>>>>> ")) {
            hits.push(`${path.relative(root, f)}:${i + 1}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it("no hard-coded secrets in .ts/.tsx under app, lib, components", () => {
    const dirs = ["app", "lib", "components"].map(at);
    const files = dirs.flatMap(walk).filter((f) => /\.tsx?$/.test(f));
    const hits: string[] = [];
    for (const f of files) {
      fs.readFileSync(f, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (SECRET_RE.test(line)) hits.push(`${path.relative(root, f)}:${i + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });
});

describe("environment files", () => {
  it(".env.example exists", () => {
    expect(fs.existsSync(at(".env.example"))).toBe(true);
  });

  it(".env is listed in .gitignore", () => {
    const gitignore = fs.existsSync(at(".gitignore"))
      ? fs.readFileSync(at(".gitignore"), "utf8")
      : "";
    const lines = gitignore.split(/\r?\n/).map((l) => l.trim());
    expect(lines.some((l) => [".env", "/.env", ".env*"].includes(l))).toBe(true);
  });
});

describe("dependencies", () => {
  it.skipIf(!fs.existsSync("node_modules"))(
    "every package in dependencies has a folder in node_modules",
    () => {
      const deps = Object.keys(readPkg().dependencies ?? {});
      const missing = deps.filter((d) => !fs.existsSync(at("node_modules", d)));
      expect(missing).toEqual([]);
    },
  );
});
