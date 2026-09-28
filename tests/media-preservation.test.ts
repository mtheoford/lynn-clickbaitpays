import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { siteVideoSources } from "../lib/video-sources.ts";

const root = new URL("../", import.meta.url);
const currentVideos = {
  welcome: "https://cbp-media.proneurs.org/videos/clickbaitpays-overview-2026-09-10.mp4",
  strategy: "https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-2026-09-10.mp4",
  tour: "https://cbp-media.proneurs.org/videos/clickbaitpays-back-office-2026-09-10.mp4",
};
const currentPosters = {
  welcome: "/video-posters/welcome.jpg",
  strategy: "/video-posters/income-strategy.jpg",
  tour: "/video-posters/back-office.jpg",
};

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

test("English retains the three approved project videos", () => {
  assert.deepEqual(siteVideoSources.en, currentVideos);
});

test("French and German use the six approved localized recordings", () => {
  for (const locale of ["fr", "de"] as const) {
    assert.deepEqual(siteVideoSources[locale], {
      welcome: `https://cbp-media.proneurs.org/videos/clickbaitpays-overview-${locale}-2026-09-28.mp4`,
      strategy: `https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-${locale}-2026-09-28.mp4`,
      tour: `https://cbp-media.proneurs.org/videos/clickbaitpays-presentation-${locale}-2026-09-28.mp4`,
    });
  }
});

test("English retains the three approved title-frame posters", () => {
  const page = source("lib/video-posters.ts");
  const value = initializer(page, "siteVideoPosters");
  assert.ok(ts.isObjectLiteralExpression(value));
  const english = value.properties.find((property) => property.name?.getText(page) === "en");
  assert.ok(english && ts.isPropertyAssignment(english) && ts.isObjectLiteralExpression(english.initializer));
  const posters = Object.fromEntries(english.initializer.properties.map((property) => {
    assert.ok(ts.isPropertyAssignment(property));
    assert.ok(ts.isStringLiteral(property.initializer));
    return [property.name.getText(page), property.initializer.text];
  }));
  assert.deepEqual(posters, currentPosters, "Each video must retain the matching title-frame poster from its approved recording.");
});

test("approved videos use the dedicated CBP media domain and MP4 format", () => {
  for (const sourceUrl of Object.values(siteVideoSources).flatMap(Object.values)) {
    const url = new URL(sourceUrl);
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "cbp-media.proneurs.org");
    assert.match(url.pathname, /^\/videos\/[a-z0-9-]+\.mp4$/);
    assert.equal(url.search, "");
    assert.equal(url.hash, "");
  }
});

test("approved title-frame poster files are preserved byte for byte", () => {
  const baselines = {
    welcome: "01bb0706fde7f13c44a1413d2feaecdf0dca0e2f7a33f76deee7987d342a71a5",
    strategy: "420b5c421dab88e27ee9b5173dc408dbf43ab6bbf4a5f52d45f7a65bffa9ffc8",
    tour: "6d8ca98c883a93fe1537a527e7e2294accaf1809e058145b5f0ee3bbfb398699",
  };
  for (const [slot, poster] of Object.entries(currentPosters)) {
    const bytes = readFileSync(new URL(`public${poster}`, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), baselines[slot as keyof typeof baselines]);
  }
});

// These approved-content baselines predate the multilingual rollout. They ignore
// formatting/comments but catch accidental replacement with older copy. Update
// a baseline only when a deliberate content change has been reviewed.
test("English and French public copy and calculator instructions remain intact", () => {
  const baselines = [
    ["app/page.tsx", "siteCopy", "en", "61506063d5798e758a946360d57fe5b9b81e5054d82e8446c81d66b49df1621e"],
    // 2026-09-28: only the six video-language title/summary notices changed.
    ["app/page.tsx", "siteCopy", "fr", "62edc08bfeb55c9c6798012167f3a7fc12ba76d7f9695cab9433197e6d9e276b"],
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
