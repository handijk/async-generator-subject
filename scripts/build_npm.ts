import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");
const {
  default: { name, version, license },
} = await import("../deno.json", {
  with: { type: "json" },
});

await build({
  entryPoints: [
    "./empty-async-generator.ts",
    "./subject-async-generator.ts",
    "./replay-subject-async-generator.ts",
  ],
  outDir: "./npm",
  importMap: "deno.json",
  typeCheck: false,
  shims: {
    deno: true,
  },
  package: {
    name,
    version,
    license,
    description: "Your package.",
    repository: {
      type: "git",
      url: "git+https://github.com/handijk/async-generator-subject.git",
    },
    bugs: {
      url: "https://github.com/handijk/async-generator-subject/issues",
    },
  },
  postBuild() {
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
