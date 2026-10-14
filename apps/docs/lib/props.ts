import path from "node:path";
import { withCustomConfig } from "react-docgen-typescript";
import ts from "typescript";
import type { PropsSource } from "./registry";

/*
 * Props tables from the real TypeScript source of @kerb/react, read at build
 * time. Components go through react-docgen-typescript; option types (for
 * hooks such as useToast) through the TypeScript compiler directly.
 */

export type PropRow = {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
};

export type PropsTableData = { heading: string; rows: PropRow[] };

const reactSrc = path.join(process.cwd(), "..", "..", "packages", "react", "src");
const tsconfig = path.join(process.cwd(), "..", "..", "packages", "react", "tsconfig.json");

let docgen: ReturnType<typeof withCustomConfig> | null = null;

function parser() {
  docgen ??= withCustomConfig(tsconfig, {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    // Only Kerb's own props, not every attribute a native element accepts.
    // A prop Kerb redeclares (ComfortControls' title) counts as Kerb's
    propFilter: (prop) =>
      !prop.declarations ||
      prop.declarations.some(
        (declaration) => !declaration.fileName.includes("node_modules"),
      ),
  });
  return docgen;
}

/** "Default `primary`" at the end of a JSDoc line becomes the default value */
function splitDefault(description: string): { text: string; fallback: string | null } {
  const match = /^(.*?)\s*(?:\.\s*)?Default:?\s+(.+?)\.?$/s.exec(description);
  if (!match) return { text: description, fallback: null };
  return { text: match[1] ?? "", fallback: (match[2] ?? "").replace(/`/g, "") };
}

function row(
  name: string,
  type: string,
  required: boolean,
  description: string,
  defaultValue: string | null,
): PropRow {
  const { text, fallback } = splitDefault(description.trim());
  return {
    name,
    type: type.replace(/\s+/g, " "),
    required,
    defaultValue: (defaultValue ?? fallback)?.replace(/\s+/g, " ") ?? null,
    description: text,
  };
}

function componentProps(file: string, component: string): PropRow[] {
  const docs = parser().parse(path.join(reactSrc, file));
  const doc = docs.find((entry) => entry.displayName === component);
  if (!doc) throw new Error(`No docs for ${component} in ${file}`);
  return Object.values(doc.props).map((prop) =>
    row(
      prop.name,
      prop.type.raw ?? prop.type.name,
      prop.required,
      prop.description,
      prop.defaultValue ? String(prop.defaultValue.value) : null,
    ),
  );
}

const programs = new Map<string, ts.Program>();

function typeProps(file: string, typeName: string): PropRow[] {
  const fileName = path.join(reactSrc, file);
  let program = programs.get(fileName);
  if (!program) {
    program = ts.createProgram([fileName], { strict: true, jsx: ts.JsxEmit.ReactJSX });
    programs.set(fileName, program);
  }
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(fileName);
  if (!source) throw new Error(`Cannot read ${file}`);

  let declaration: ts.Node | undefined;
  source.forEachChild((node) => {
    if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name.text === typeName
    ) {
      declaration = node;
    }
  });
  if (!declaration) throw new Error(`No type ${typeName} in ${file}`);

  const type = checker.getTypeAtLocation(declaration);
  const own = (symbol: ts.Symbol) =>
    (symbol.getDeclarations() ?? []).some(
      (node) => !node.getSourceFile().fileName.includes("node_modules"),
    );
  return type.getProperties().filter(own).map((symbol) => {
    const propertyType = checker.getTypeOfSymbolAtLocation(symbol, declaration!);
    const optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
    const print = (each: ts.Type) =>
      checker.typeToString(each, undefined, ts.TypeFormatFlags.NoTruncation);
    // A union behind an alias (ToastTone) is spelled out: "success" | "info" | "error"
    const members = propertyType.isUnion()
      ? propertyType.types.filter((each) => !(each.flags & ts.TypeFlags.Undefined))
      : [propertyType];
    return row(
      symbol.getName(),
      members.map(print).join(" | "),
      !optional,
      ts.displayPartsToString(symbol.getDocumentationComment(checker)),
      null,
    );
  });
}

export function getPropsTables(sources: PropsSource[]): PropsTableData[] {
  return sources.map((source) =>
    "component" in source
      ? { heading: source.component, rows: componentProps(source.file, source.component) }
      : { heading: source.type, rows: typeProps(source.file, source.type) },
  );
}
