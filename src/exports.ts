import ts from "typescript";
import transformFunction from "@suseejs/transformer";
import type { DepsFile, BundleHandler } from "@suseejs/types";

/**
 * Transforms a commonjs file into an ES module.
 * @param {ts.CompilerOptions} compilerOptions - The compiler options.
 * @returns {BundleHandler} - A bundle handler that transforms a commonjs file into an ES module.
 */
function commonjsExportsHandler(
  compilerOptions: ts.CompilerOptions,
): BundleHandler {
  return (deps: DepsFile) => {
    if (deps.type && deps.type === "cjs") {
      const sourceFile = ts.createSourceFile(
        deps.file,
        deps.content,
        ts.ScriptTarget.Latest,
        true,
      );
      const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        const { factory } = context;
        const visitor = (node: ts.Node): ts.Node => {
          if (
            ts.isExpressionStatement(node) &&
            ts.isBinaryExpression(node.expression) &&
            ts.isPropertyAccessExpression(node.expression.left)
          ) {
            const leftExpression = node.expression.left.expression;
            const leftIdenName = node.expression.left.name;
            const rn = node.expression.right;
            if (
              ts.isIdentifier(leftExpression) &&
              ts.isIdentifier(leftIdenName)
            ) {
              const exprName = leftExpression.text;
              const leftName = leftIdenName.text;
              const _exportKeyword = factory.createModifier(
                ts.SyntaxKind.ExportKeyword,
              );
              const _defaultKeyword = factory.createModifier(
                ts.SyntaxKind.DefaultKeyword,
              );
              if (exprName === "module" && leftName === "exports") {
                if (ts.isFunctionExpression(rn)) {
                  return factory.createFunctionDeclaration(
                    [_exportKeyword, _defaultKeyword],
                    rn.asteriskToken,
                    rn.name ?? undefined,
                    rn.typeParameters,
                    rn.parameters,
                    rn.type,
                    rn.body,
                  );
                } else if (ts.isClassExpression(rn)) {
                  return factory.createClassDeclaration(
                    [_exportKeyword, _defaultKeyword],
                    rn.name ?? undefined,
                    rn.typeParameters,
                    rn.heritageClauses,
                    rn.members,
                  );
                } else if (
                  ts.isObjectLiteralExpression(rn) ||
                  ts.isArrayLiteralExpression(rn) ||
                  ts.isStringLiteral(rn) ||
                  ts.isNumericLiteral(rn) ||
                  ts.isCallExpression(rn) ||
                  ts.isIdentifier(rn) ||
                  ts.isArrowFunction(rn)
                ) {
                  return factory.createExportAssignment(undefined, false, rn);
                }
              }
              // ================================================================================== //
              else if (exprName === "exports") {
                const _name = factory.createIdentifier(leftName);

                // function
                if (ts.isFunctionExpression(rn)) {
                  return factory.createFunctionDeclaration(
                    [_exportKeyword],
                    rn.asteriskToken,
                    _name,
                    rn.typeParameters,
                    rn.parameters,
                    rn.type,
                    rn.body,
                  );
                } else if (
                  ts.isObjectLiteralExpression(rn) ||
                  ts.isArrayLiteralExpression(rn) ||
                  ts.isStringLiteral(rn) ||
                  ts.isNumericLiteral(rn) ||
                  ts.isCallExpression(rn) ||
                  ts.isIdentifier(rn) ||
                  ts.isArrowFunction(rn)
                ) {
                  const varDecl = factory.createVariableDeclaration(
                    _name,
                    undefined,
                    undefined,
                    rn,
                  );
                  return factory.createVariableStatement(
                    [_exportKeyword],
                    factory.createVariableDeclarationList(
                      [varDecl],
                      ts.NodeFlags.Const,
                    ),
                  );
                } else if (ts.isClassExpression(rn)) {
                  return factory.createClassDeclaration(
                    [_exportKeyword],
                    _name,
                    rn.typeParameters,
                    rn.heritageClauses,
                    rn.members,
                  );
                }
              }
            }
          } else if (ts.isVariableStatement(node)) {
            let __name: string | undefined = undefined;
            const decls = node.declarationList.declarations;
            if (decls.length === 1) {
              const decl = decls[0] as ts.VariableDeclaration;
              if (ts.isIdentifier(decl.name)) {
                __name = decl.name.text;
              }
              if (
                decl.initializer &&
                ts.isBinaryExpression(decl.initializer) &&
                ts.isPropertyAccessExpression(decl.initializer.left)
              ) {
                const __left = decl.initializer.left;
                const __right = decl.initializer.right;
                if (
                  ts.isIdentifier(__left.expression) &&
                  __left.expression.text === "module" &&
                  ts.isIdentifier(__left.name) &&
                  __left.name.text === "exports"
                ) {
                  //TODO
                }
              }
            }
          }
          /* ----------------------Returns for visitor function------------------------------- */
          return ts.visitEachChild(node, visitor, context);
        };
        /* --------------------Returns for transformer function--------------------------------- */
        return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
      };
      let _content = transformFunction(
        transformer,
        sourceFile,
        compilerOptions,
      );
      _content = _content.replace(/^s*;\s*$/gm, "").trim();
      const { file, content, ...rest } = deps;
      return { file, content: _content, ...rest } as DepsFile;
    } else {
      return deps;
    }
  };
}

export default commonjsExportsHandler;
