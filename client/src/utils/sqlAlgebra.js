export function sqlAlgebra(sqlQuery) {
  try {
    const raw = (sqlQuery || "").trim().replace(/;+/g, "");
    if (!raw) return "";

    // 1) Manejo de operadores de conjunto al nivel superior
    const setOp = splitTopLevelSet(raw);
    if (setOp) {
      const { left, right, op } = setOp;
      const sym = op === "UNION" ? "∪" : op === "INTERSECT" ? "∩" : "-";
      return `(${sqlAlgebra(left)} ${sym} ${sqlAlgebra(right)})`;
    }

    // 2) SELECT principal: campos, FROM, WHERE (ignoramos GROUP/ORDER por ahora)
    const { select, from, where } = splitSelectFromWhere(raw);
    if (!from) return "No se pudo convertir la consulta SQL a algebra.";

    // 3) FROM → Álgebra (maneja JOINs, CROSS JOIN, alias, y subqueries simples)
    const fromAlg = fromToAlgebra(from);

    // 4) WHERE → selección
    const selected = where ? `σ${where.trim()}(${fromAlg})` : fromAlg;

    // 5) SELECT list → proyección (si no es *)
    const fields = select.trim();
    if (fields === "*" || fields.toUpperCase() === "ALL") {
      return selected;
    }
    return `π${fields}(${selected})`;
  } catch (err) {
    return "Error al convertir SQL a algebra: " + err.message;
  }
}

// ================= Helpers =================

function collapseWs(s) {
  return s.replace(/\s+/g, " ").trim();
}

// (no-op) stripParens removed: not needed; avoided to satisfy linter

function splitTopLevelSet(q) {
  const up = q.toUpperCase();
  return (
    splitAtKeyword(up, q, " UNION ") ||
    splitAtKeyword(up, q, " INTERSECT ") ||
    splitAtKeyword(up, q, " EXCEPT ")
  );
}

function splitAtKeyword(upper, original, keyword) {
  let level = 0;
  for (let i = 0; i <= original.length - keyword.length; i++) {
    const ch = original[i];
    if (ch === "(") level++;
    else if (ch === ")") level--;
    if (level === 0 && upper.slice(i, i + keyword.length) === keyword) {
      const left = original.slice(0, i).trim();
      const right = original.slice(i + keyword.length).trim();
      return { left, right, op: keyword.trim() };
    }
  }
  return null;
}

function splitSelectFromWhere(q) {
  // Muy básico: asume SELECT ... FROM ... [WHERE ...]
  const m = q.match(
    /^SELECT\s+([\s\S]+?)\s+FROM\s+([\s\S]+?)\s*(?:WHERE\s+([\s\S]+))?$/i
  );
  if (!m) return { select: "", from: "", where: "" };
  return { select: m[1], from: m[2], where: m[3] || "" };
}

function fromToAlgebra(fromClause) {
  let s = collapseWs(fromClause);

  // Parse base item (table or subquery)
  let { itemAlg: leftAlg, rest } = parseFromItem(s);
  s = rest;

  // Process JOIN chain
  while (s) {
    const joinM = s.match(
      /^(INNER|LEFT(?:\s+OUTER)?|RIGHT(?:\s+OUTER)?|FULL(?:\s+OUTER)?|CROSS)?\s*JOIN\s+([\s\S]+)$/i
    );
    if (!joinM) break;
    const jt = (joinM[1] || "INNER").toUpperCase();
    s = joinM[2];

    // Next item
    const { itemAlg: rightAlg, rest: afterItem } = parseFromItem(s);
    s = afterItem;

    if (jt === "CROSS") {
      leftAlg = `${leftAlg} × ${rightAlg}`;
      continue;
    }

    // Expect ON condition
    const onM = s.match(/^ON\s+([\s\S]+)$/i);
    if (!onM) {
      // If ON is missing, degrade to natural join
      leftAlg = `(${leftAlg} ⋈ ${rightAlg})`;
      break;
    }
    // Extract condition until next JOIN at top-level
    let cond = onM[1];
    let { segment, rest: afterCond } = readUntilNextTopLevelJoin(cond);
    cond = segment.trim();
    s = afterCond;

    const sym = jt.startsWith("LEFT")
      ? "⟕"
      : jt.startsWith("RIGHT")
      ? "⟖"
      : jt.startsWith("FULL")
      ? "⟗"
      : "⋈";
    leftAlg = `${leftAlg} ${sym}_{${cond}} ${rightAlg}`;
  }

  return leftAlg;
}

function parseFromItem(s) {
  s = s.trim();
  // Subquery
  if (s.startsWith("(")) {
    const { segment, endIndex } = readBalancedParens(s, 0);
    const inner = segment.slice(1, -1);
    const rest = s.slice(endIndex).trim();
    const alias = readAlias(rest);
    const aliasUsed = alias.alias
      ? ` ρ ${alias.alias} (${sqlAlgebra(inner)})`
      : `(${sqlAlgebra(inner)})`;
    return { itemAlg: aliasUsed.trim(), rest: alias.rest };
  }
  // Table [AS] alias
  const tableM = s.match(
    /^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)(?:\s+AS\s+([A-Za-z_][A-Za-z0-9_]*))?(?:\s+([A-Za-z_][A-Za-z0-9_]*))?(.*)$/i
  );
  if (!tableM) return { itemAlg: s, rest: "" };
  const table = tableM[1];
  const alias =
    tableM[2] || (tableM[3] && !isJoinKeyword(tableM[3]) ? tableM[3] : "");
  let rest = tableM[4] || "";
  rest = rest.trim();
  const alg =
    alias && alias.toLowerCase() !== table.toLowerCase()
      ? `ρ ${alias} (${table})`
      : table;
  return { itemAlg: alg, rest };
}

function isJoinKeyword(tok) {
  if (!tok) return false;
  const t = tok.toUpperCase();
  return (
    t === "JOIN" ||
    t === "ON" ||
    t === "INNER" ||
    t === "LEFT" ||
    t === "RIGHT" ||
    t === "FULL" ||
    t === "OUTER" ||
    t === "CROSS"
  );
}

function readBalancedParens(s, start) {
  let level = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") level++;
    else if (ch === ")") level--;
    if (level === 0) {
      return { segment: s.slice(0, i + 1), endIndex: i + 1 };
    }
  }
  return { segment: s, endIndex: s.length };
}

function readUntilNextTopLevelJoin(s) {
  let level = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") level++;
    else if (ch === ")") level--;
    if (level === 0) {
      // Lookahead for next JOIN keyword
      const tail = s.slice(i);
      const m = tail.match(
        /^\s+(INNER|LEFT(?:\s+OUTER)?|RIGHT(?:\s+OUTER)?|FULL(?:\s+OUTER)?|CROSS)?\s*JOIN\b/i
      );
      if (m) {
        return { segment: s.slice(0, i), rest: tail.trimStart() };
      }
    }
  }
  return { segment: s, rest: "" };
}

function readAlias(s) {
  const m = s.match(/^(?:AS\s+)?([A-Za-z_][A-Za-z0-9_]*)([\s\S]*)$/i);
  if (!m) return { alias: "", rest: s };
  return { alias: m[1], rest: m[2].trim() };
}
