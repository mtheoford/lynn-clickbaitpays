import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const currentVideoIds = ["PhTIPCzqMjw", "YFbW5RSLOQM", "JQEnm6I37dI"];

function source(file: string) {
  return ts.createSourceFile(
    file,
    readFileSync(new URL(file, root), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function initializer(file: ts.SourceFile, name: string): ts.Expression {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) !== name || !declaration.initializer) continue;
      let value = declaration.initializer;
      while (ts.isSatisfiesExpression(value) || ts.isAsExpression(value) || ts.isParenthesizedExpression(value)) {
        value = value.expression;
      }
      return value;
    }
  }
  throw new Error(`Missing content declaration: ${name}`);
}

function contentDigest(file: string, name: string, locale?: string) {
  const parsed = source(file);
  let value = initializer(parsed, name);
  if (locale) {
    assert.ok(ts.isObjectLiteralExpression(value));
    const property = value.properties.find((item) => item.name?.getText(parsed) === locale);
    assert.ok(property && ts.isPropertyAssignment(property));
    value = property.initializer;
  }
  const canonical = ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, value, parsed);
  return createHash("sha256").update(canonical).digest("hex");
}

test("all public languages retain the three current videos in their existing order", () => {
  const page = source("app/page.tsx");
  const ids: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(page) === "videoUrl") {
      const videoId = node.arguments[0];
      assert.ok(videoId && ts.isStringLiteral(videoId));
      ids.push(videoId.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(page);
  assert.deepEqual(ids, currentVideoIds, "A language rollout must not replace the currently approved welcome, strategy or tour video.");
});

test("French and German request captions on the same original videos", () => {
  const page = source("app/page.tsx");
  const videoFunction = page.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "videoUrl");
  assert.ok(videoFunction);
  const javascript = ts.transpileModule(videoFunction.getText(page), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const videoUrl = runInNewContext(`${javascript}\nvideoUrl`) as (id: string, locale: string) => string;
  for (const id of currentVideoIds) {
    assert.equal(videoUrl(id, "en"), `https://www.youtube.com/embed/${id}`);
    for (const locale of ["fr", "de"]) {
      const url = new URL(videoUrl(id, locale));
      assert.equal(url.origin, "https://www.youtube.com");
      assert.equal(url.pathname, `/embed/${id}`);
      assert.equal(url.searchParams.get("cc_load_policy"), "1");
      assert.equal(url.searchParams.get("cc_lang_pref"), locale);
      assert.equal(url.searchParams.get("hl"), locale);
    }
  }
});

// These approved-content baselines predate the multilingual rollout. They ignore
// formatting/comments but catch accidental replacement with older copy. Update
// a baseline only when a deliberate content change has been reviewed.
test("English and French public copy and calculator instructions remain intact", () => {
  const baselines = [
    ["app/page.tsx", "siteCopy", "en", "61506063d5798e758a946360d57fe5b9b81e5054d82e8446c81d66b49df1621e"],
    ["app/page.tsx", "siteCopy", "fr", "7e859f6e9e237318bb2aabd15d7a90605ea0f3f98377bf37f56330150a414a75"],
    ["app/ReferralSimulator.tsx", "calculatorCopy", "en", "f432d62e0fd6353866a978460e963193a0015711039f82fd037d55d5d3da41d5"],
    ["app/ReferralSimulator.tsx", "calculatorCopy", "fr", "0812de8ad28509103e1380072e5bcf54fda97f1cb9e7f2209af48196b669680b"],
    ["app/TestimonialGallery.tsx", "testimonialUi", "en", "473451d09bd310ccdf32ac95762b1e6e7194b9f1cbd26a9f128f47d36cccf2d7"],
    ["app/TestimonialGallery.tsx", "testimonialUi", "fr", "24e6e5bc082e21460f3f871adaab39dfd12129c6af292a2007c3d5efebf24429"],
  ];
  for (const [file, name, locale, expected] of baselines) {
    assert.equal(contentDigest(file, name, locale), expected, `${file}: ${locale} content changed`);
  }
});

test("existing English and French testimonial evidence is preserved", () => {
  assert.equal(contentDigest("app/TestimonialGallery.tsx", "englishTestimonials"), "6f53276d55e1d369aabecf4403c5169eccda499db5e92e33af7096d8d234e87c");
  assert.equal(contentDigest("app/TestimonialGallery.tsx", "frenchTestimonials"), "8c08e7744b1c59d01a42a58635c35b9c0ca1adf056df9671c46a922c5822917d");
});

test("the approved English and French sales preview images are not replaced", () => {
  const baselines = [
    ["public/clickbaitpays-replicated-site-preview.jpg", "aeedf9e9cc17b23ef7d2093d4214ce6753bb2f525b70a30e6e98050f79b34734"],
    ["public/clickbaitpays-replicated-site-preview-fr.jpg", "33324d866e1a4578d8783b71849a0bd771086d2861a02de75959736073ca6d2e"],
  ];
  for (const [file, expected] of baselines) {
    assert.equal(createHash("sha256").update(readFileSync(new URL(file, root))).digest("hex"), expected, `${file}: approved image changed`);
  }
});
