import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { SiteLocale } from "../lib/i18n.ts";
import { videoPlaybackUrl } from "../lib/video-playback.ts";

const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);
const videos = [
  { name: "welcome", id: "PhTIPCzqMjw" },
  { name: "strategy", id: "YFbW5RSLOQM" },
  { name: "tour", id: "JQEnm6I37dI" },
] as const;
const locales = ["en", "fr", "de"] as const;
const playLabels = {
  en: "Play video",
  fr: "Lire la vidéo",
  de: "Video abspielen",
};

type VideoProps = {
  src: string;
  title: string;
  poster: string;
  locale: SiteLocale;
  priority?: boolean;
};

// Node's native TypeScript runner does not transform JSX. Compile the actual
// component for these SSR tests, using real React and Next Image implementations
// and the production playback helper; no component or hook behavior is mocked.
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
    require: (name: string) => name === "@/lib/video-playback"
      ? { videoPlaybackUrl }
      : require(name),
  }) as { default: ComponentType<VideoProps> };
  return result.default;
}

const SiteVideo = loadSiteVideo();

function originalUrl(id: string, locale: SiteLocale) {
  const base = `https://www.youtube.com/embed/${id}`;
  return locale === "en"
    ? base
    : `${base}?cc_load_policy=1&cc_lang_pref=${locale}&hl=${locale}`;
}

test("pressing Play preserves every approved video and its existing locale settings", () => {
  for (const { id } of videos) {
    for (const locale of locales) {
      const original = new URL(originalUrl(id, locale));
      const playable = new URL(videoPlaybackUrl(original.href));
      assert.equal(playable.origin, original.origin);
      assert.equal(playable.pathname, original.pathname);
      assert.equal(playable.searchParams.get("autoplay"), "1");
      assert.equal(playable.searchParams.get("playsinline"), "1");
      for (const [name, value] of original.searchParams) {
        assert.equal(playable.searchParams.get(name), value, `${locale}: ${name} was changed`);
      }
      for (const captionParameter of ["cc_load_policy", "cc_lang_pref", "hl"]) {
        assert.equal(playable.searchParams.has(captionParameter), locale !== "en");
      }
    }
  }
});

test("playback URL changes only autoplay and inline playback, without duplicate parameters", () => {
  const source = "https://www.youtube.com/embed/PhTIPCzqMjw?cc_load_policy=1&cc_lang_pref=de&hl=de&autoplay=0&playsinline=0&start=12#example";
  const playable = videoPlaybackUrl(source);
  assert.equal(videoPlaybackUrl(playable), playable);
  const url = new URL(playable);
  assert.deepEqual(url.searchParams.getAll("autoplay"), ["1"]);
  assert.deepEqual(url.searchParams.getAll("playsinline"), ["1"]);
  assert.equal(url.searchParams.get("start"), "12");
  assert.equal(url.hash, "#example");
});

for (const locale of locales) {
  for (const { name, id } of videos) {
    test(`${locale} ${name} initially renders an accessible local cover, not a YouTube player`, () => {
      const poster = `/video-posters/${name}-${locale}.jpg`;
      const title = `${name} overview`;
      const html = renderToStaticMarkup(createElement(SiteVideo, {
        src: originalUrl(id, locale),
        title,
        poster,
        locale,
        priority: name === "welcome",
      }));

      assert.doesNotMatch(html, /<iframe\b/i, "YouTube must not load before an explicit Play action");
      assert.doesNotMatch(html, /(?:youtube(?:-nocookie)?\.com|ytimg\.com|googlevideo\.com)/i,
        "The initial cover must not embed, prefetch, preconnect to or preload YouTube resources");
      assert.equal((html.match(/<button\b/g) ?? []).length, 1);
      assert.match(html, /<button\b[^>]*type="button"/);
      assert.ok(html.includes(`aria-label="${playLabels[locale]}: ${title}"`));
      assert.ok(html.includes(`>${playLabels[locale]}</span>`), "The visible Play label must be localized");
      assert.match(html, /<img\b[^>]*alt=""/,
        "The cover is decorative because the containing button already names the video");
      assert.ok(html.includes(poster) || html.includes(encodeURIComponent(poster)),
        "The actual rendered image must use this video's local, language-specific poster");
      assert.ok(statSync(new URL(`public${poster}`, root)).size > 0, `Missing local poster: ${poster}`);
    });
  }
}

test("the public page routes all three approved videos through the shared localized facade", () => {
  const filename = "app/page.tsx";
  const page = ts.createSourceFile(filename, readFileSync(new URL(filename, root), "utf8"),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const facades: ts.JsxSelfClosingElement[] = [];
  let iframeCount = 0;
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(page) === "SiteVideo") {
      facades.push(node);
    }
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(page) === "iframe") iframeCount++;
    ts.forEachChild(node, visit);
  }
  visit(page);
  assert.equal(iframeCount, 0, "Public page must not bypass the click-to-play cover");
  assert.equal(facades.length, videos.length);
  for (const [index, element] of facades.entries()) {
    const attributes = element.attributes.properties.filter(ts.isJsxAttribute);
    const attribute = (name: string) => attributes.find((item) => item.name.getText(page) === name)?.initializer;
    assert.equal(attribute("src")?.getText(page), `{videoUrl("${videos[index].id}", locale)}`);
    assert.equal(attribute("locale")?.getText(page), "{locale}");
    assert.equal(attribute("poster")?.getText(page), `{\`/video-posters/${videos[index].name}-\${locale}.jpg\`}`);
    assert.ok(attribute("title"), "Every iframe and cover must retain a descriptive localized title");
  }
});

test("video covers cannot expand the responsive hero grid beyond the viewport", () => {
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
    "The click-to-play facade must derive height from its constrained width",
  );
});
