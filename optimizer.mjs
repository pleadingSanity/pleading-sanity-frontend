// /tools/optimizer.mjs
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import glob from "glob";
import cheerio from "cheerio";
import { minify as terser } from "terser";
import csso from "csso";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, "..");

const read = (p) => fs.readFile(p, "utf8");
const write = (p, c) => fs.writeFile(p, c);
const exists = async (p) => !!(await fs.stat(p).catch(() => null));
const isExternal = (href = "") => /^https?:\/\//i.test(href);

const htmlFiles = glob.sync("**/*.html", { cwd: ROOT, ignore: ["node_modules/**", ".git/**"] });
const jsFiles   = glob.sync("**/*.js",   { cwd: ROOT, ignore: ["node_modules/**", ".git/**", "tools/**"] });
const cssFiles  = glob.sync("**/*.css",  { cwd: ROOT, ignore: ["node_modules/**", ".git/**"] });

const summary = { htmlUpdated: 0, jsMinified: 0, cssMinified: 0, created: [] };

async function optimizeHTML(fp) {
  const abs = path.join(ROOT, fp);
  const html = await read(abs);
  const $ = cheerio.load(html, { decodeEntities: false });

  if ($('meta[name="viewport"]').length === 0) {
    $("head").prepend('<meta name="viewport" content="width=device-width, initial-scale=1" />\n');
  }
  if ($('meta[name="description"]').length === 0) {
    $("head").prepend('<meta name="description" content="Pleading Sanity — movement, sanity hub, and streetwear." />\n');
  }

  $("img:not([loading])").attr("loading", "lazy");
  $("iframe:not([loading])").attr("loading", "lazy");

  $("video").each((_, el) => {
    const v = $(el);
    if (!v.attr("muted")) v.attr("muted", "");
    if (!v.attr("playsinline")) v.attr("playsinline", "");
    if (!v.attr("preload")) v.attr("preload", "metadata");
  });

  $('a[href]').each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href") || "";
    if (isExternal(href)) {
      const rel = ($a.attr("rel") || "").split(/\s+/);
      if (!rel.includes("noopener")) rel.push("noopener");
      if (!rel.includes("noreferrer")) rel.push("noreferrer");
      $a.attr("rel", rel.join(" ").trim());
      if ($a.attr("target") !== "_blank") $a.attr("target", "_blank");
    }
  });

  await write(abs, $.html());
  summary.htmlUpdated++;
}

async function minifyJS(fp) {
  const abs = path.join(ROOT, fp);
  const code = await read(abs);
  const out = await terser(code, { compress: true, mangle: true });
  if (out.code && out.code.length < code.length) {
    await write(abs, out.code);
    summary.jsMinified++;
  }
}

async function minifyCSS(fp) {
  const abs = path.join(ROOT, fp);
  const css = await read(abs);
  const out = csso.minify(css);
  if (out.css && out.css.length < css.length) {
    await write(abs, out.css);
    summary.cssMinified++;
  }
}

(async function run(){
  console.log("🔧 Optimizer starting at", ROOT);
  for (const f of htmlFiles) { try { await optimizeHTML(f); } catch (e) { console.warn("HTML skip:", f, e.message); } }
  for (const f of jsFiles)   { try { await minifyJS(f); }     catch (e) { console.warn("JS skip:", f, e.message); } }
  for (const f of cssFiles)  { try { await minifyCSS(f); }    catch (e) { console.warn("CSS skip:", f, e.message); } }
  console.log("✅ Done:", JSON.stringify(summary, null, 2));
  process.exit(0);
})();