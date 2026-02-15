import ts from "typescript";
import type { SuseePlugin } from "@suseejs/types";
import resolves from "@phothinmaung/resolves";
import utilities from "@suseejs/utils";
import commonjsExportsHandler from "./exports.js";
import commonjsImportsHandler from "./imports.js";

/**
 * A Susee plugin that transforms commonjs exports and imports into ES modules.
 * @param {ts.CompilerOptions} compilerOptions - The compiler options.
 * @returns {SuseePlugin} - A Susee plugin.
 */
function suseeCommonJS(compilerOptions: ts.CompilerOptions): SuseePlugin {
  return {
    type: "dependency",
    async: true,
    name: "@suseejs/plugin-commonjs",
    func: async (deps) => {
      const resolvedHandler = resolves([
        [commonjsExportsHandler, compilerOptions],
        [commonjsImportsHandler, compilerOptions],
      ]);
      const resolved = await resolvedHandler.series();
      for (const res of resolved) {
        await utilities.wait(500);
        deps = deps.map(res);
        await utilities.wait(500);
      }
      return deps;
    },
  };
}

export default suseeCommonJS;
