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
          if (
            ts.isIdentifier(leftExpression) &&
            ts.isIdentifier(leftIdenName)
          ) {
            const exprName = leftExpression.text;
            const leftName = leftIdenName.text;
            if (exprName === "module" && leftName === "exports") {
              const newExportAssignment = factory.createExportAssignment(
                undefined,
                undefined,
                node.expression.right,
              );
              return newExportAssignment;
            } else if (exprName === "exports") {
              const rn = node.expression.right;
              const _name = factory.createIdentifier(leftName);
              const _exportKeyword = factory.createModifier(
                ts.SyntaxKind.ExportKeyword,
              );
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
                ts.isCallExpression(rn)
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
        }
        /* ----------------------Returns for visitor function------------------------------- */
        return ts.visitEachChild(node, visitor, context);
      };
      /* --------------------Returns for transformer function--------------------------------- */
      return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
    };
    let _content = transformFunction(transformer, sourceFile, compilerOptions);
    _content = _content.replace(/^s*;\s*$/gm, "").trim();
    const { file, content, ...rest } = deps;
    return { file, content: _content, ...rest } as DepsFile;
  };
}

export default commonjsExportsHandler;
