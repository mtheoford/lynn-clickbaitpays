import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);
const videos = [
  {
    slot: "welcome",
    poster: "/video-posters/welcome.jpg",
    src: "https://cbp-media.proneurs.org/videos/clickbaitpays-overview-2026-09-10.mp4",
  },
  {
    slot: "strategy",
    poster: "/video-posters/income-strategy.jpg",
    src: "https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-2026-09-10.mp4",
  },
  {
    slot: "tour",
    poster: "/video-posters/back-office.jpg",
    src: "https://cbp-media.proneurs.org/videos/clickbaitpays-back-office-2026-09-10.mp4",
  },
] as const;

type VideoProps = {
  poster: string;
  src: string;
  title: string;
};

// Node's native TypeScript runner does not transform JSX. Compile the actual
// component for an SSR check with the real React implementation.
function loadSiteVideo(): ComponentType<VideoProps> {
  const source = readFileSync(new URL("app/SiteVideo.tsx", root), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const componentModule = { exports: {} };
  const result = runInNewContext(`${javascript}\nmodule.exports`, {
    module: componentModule,
    exports: componentModule.exports,
    require,
  }) as { default: ComponentType<VideoProps> };
  return result.default;
}

const SiteVideo = loadSiteVideo();

for (const { poster, slot, src } of videos) {
  test(`${slot} renders its approved native poster and project-hosted MP4 without a custom facade`, () => {
    const title = `${slot} overview`;
    const html = renderToStaticMarkup(createElement(SiteVideo, { poster, src, title }));

    assert.equal((html.match(/<video\b/g) ?? []).length, 1);
    assert.match(html, /<video\b[^>]*controls=""/);
    assert.match(html, /<video\b[^>]*playsinline=""/i);
    assert.match(html, /<video\b[^>]*preload="metadata"/);
    assert.ok(html.includes(`poster="${poster}"`));
    assert.ok(html.includes(`aria-label="${title}"`));
    assert.ok(html.includes(`<source src="${src}" type="video/mp4"/>`));
    assert.doesNotMatch(html, /<(?:iframe|button|img)\b/i);
    assert.doesNotMatch(html, /youtube/i);
  });
}

test("the public page routes all three approved sources through the shared native player", () => {
  const filename = "app/page.tsx";
  const page = ts.createSourceFile(filename, readFileSync(new URL(filename, root), "utf8"),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const players: ts.JsxSelfClosingElement[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(page) === "SiteVideo") {
      players.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(page);

  assert.equal(players.length, videos.length);
  for (const [index, element] of players.entries()) {
    const attributes = element.attributes.properties.filter(ts.isJsxAttribute);
    const attribute = (name: string) => attributes.find((item) => item.name.getText(page) === name)?.initializer;
    assert.equal(attribute("src")?.getText(page), `{siteVideoSources.${videos[index].slot}}`);
    assert.equal(attribute("poster")?.getText(page), `{siteVideoPosters.${videos[index].slot}}`);
    assert.ok(attribute("title"), "Every video must retain its descriptive localized title");
    assert.equal(attribute("locale"), undefined);
    assert.equal(attribute("priority"), undefined);
  }

  const source = page.getFullText();
  assert.doesNotMatch(source, /youtube\.com|videoUrl\(/i);
});

test("new-video title posters replace the obsolete localized YouTube covers", () => {
  for (const { poster } of videos) {
    assert.ok(readFileSync(new URL(`public${poster}`, root)).byteLength > 0, `Missing poster: ${poster}`);
  }
  for (const slot of ["welcome", "strategy", "tour"]) {
    for (const locale of ["en", "fr", "de"]) {
      assert.equal(existsSync(new URL(`public/video-posters/${slot}-${locale}.jpg`, root)), false);
    }
  }
  assert.equal(existsSync(new URL("lib/video-playback.ts", root)), false);
});

test("native videos cannot expand the responsive hero grid beyond the viewport", () => {
  const css = readFileSync(new URL("app/globals.css", root), "utf8");

  assert.match(
    css,
    /grid-template-columns:\s*minmax\(0,\s*0\.7fr\)\s+minmax\(0,\s*1\.3fr\)/,
    "Desktop hero tracks must be allowed to shrink below video intrinsic width",
  );
  assert.ok(
    (css.match(/grid-template-columns:\s*minmax\(0,\s*1fr\)/g) ?? []).length >= 2,
    "Both single-column hero breakpoints must use a zero minimum track size",
  );
  assert.match(
    css,
    /\.hero-copy,\s*\.welcome-feature\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;[^}]*\}/,
    "Hero grid items must not impose their intrinsic minimum width",
  );
  assert.match(
    css,
    /\.hero-video,\s*\.strategy-video,\s*\.small-video\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*max-width:\s*100%;[^}]*\}/,
    "Every video slot must remain constrained to its parent",
  );
  assert.match(
    css,
    /\.site-video\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;[^}]*height:\s*auto;[^}]*aspect-ratio:\s*16\s*\/\s*9;[^}]*overflow:\s*hidden;[^}]*\}/,
    "The native player must derive height from its constrained width",
  );
  assert.match(
    css,
    /\.site-video video\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;[^}]*\}/,
    "The native video element must fit the existing 16:9 frame",
  );
  assert.doesNotMatch(css, /site-video__(?:cover|poster|play)/);
});
