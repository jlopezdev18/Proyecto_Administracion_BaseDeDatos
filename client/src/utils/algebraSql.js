// Helpers
function normalizeSymbols(q) {
  return (
    q
      .replace(/\u2227|∧/g, " AND ")
      .replace(/\u2228|∨/g, " OR ")
      .replace(/¬/g, " NOT ")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/≠/g, "<>")
      // normalize typographic quotes and strip zero-width spaces
      .replace(/[‘’‛′`]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, (m) => (m.includes("\n") ? "\n" : " "))
      .trim()
  );
}

function isSimpleTableName(s) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s);
}

function wrapSelect(sqlOrTable) {
  const s = sqlOrTable.trim();
  if (/^SELECT\s/i.test(s)) return s;
  if (isSimpleTableName(s)) return `SELECT * FROM ${s}`;
  return `SELECT * FROM (${s})`;
}

function splitTopLevel(str, operator) {
  let level = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(") level++;
    else if (ch === ")") level--;
    if (level === 0 && str.slice(i, i + operator.length) === operator) {
      return [str.slice(0, i).trim(), str.slice(i + operator.length).trim()];
    }
  }
  return null;
}

// Remove a single pair of outer parentheses if they wrap the whole string
function stripOuterParens(s) {
  let t = s.trim();
  while (t.startsWith("(") && t.endsWith(")")) {
    let level = 0;
    let wrapsAll = true;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === "(") level++;
      else if (ch === ")") level--;
      if (level === 0 && i < t.length - 1) {
        wrapsAll = false;
        break;
      }
    }
    if (wrapsAll) t = t.slice(1, -1).trim();
    else break;
  }
  return t;
}

function splitJoinTopLevel(str) {
  const ops = [
    { sym: "⋈", type: "INNER" },
    { sym: "⟕", type: "LEFT" },
    { sym: "⟖", type: "RIGHT" },
    { sym: "⟗", type: "FULL" },
  ];
  let level = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(") level++;
    else if (ch === ")") level--;
    if (level !== 0) continue;
    for (const op of ops) {
      if (ch === op.sym) {
        let j = i + 1;
        // skip spaces after operator
        while (j < str.length && /\s/.test(str[j])) j++;

        let cond = null;
        let rightStart = j;

        // Case 1: Notation with subscript braces: ⋈_{cond}
        if (str[j] === "_" && str[j + 1] === "{") {
          j += 2;
          let braces = 1;
          const startCond = j;
          while (j < str.length && braces > 0) {
            if (str[j] === "{") braces++;
            else if (str[j] === "}") braces--;
            j++;
          }
          cond = str.slice(startCond, j - 1).trim();
          rightStart = j;
          while (rightStart < str.length && /\s/.test(str[rightStart]))
            rightStart++;
        } else {
          // Case 2: Inline θ-condition: ⋈cond(expr)
          // Read until the next '(' at top level; the text before it is the condition
          let k = j;
          while (k < str.length && str[k] !== "(") k++;
          if (k < str.length && str[k] === "(") {
            cond = str.slice(j, k).trim();
            rightStart = k;
          } else {
            // Fallback: no explicit condition found here
            rightStart = j;
          }
        }

        const left = str.slice(0, i).trim();
        const right = str.slice(rightStart).trim();
        return { left, right, cond, joinType: op.type };
      }
    }
  }
  return null;
}

export const algebraSql = function (algebraQuery) {
  try {
    const raw = (algebraQuery || "").trim().replace(/;+/g, "");
    const normalizedQuery = normalizeSymbols(raw);
    const query = stripOuterParens(normalizedQuery);

    // Set operators
    const unionParts = splitTopLevel(query, "∪");
    if (unionParts) {
      return `${wrapSelect(algebraSql(unionParts[0]))} UNION ${wrapSelect(
        algebraSql(unionParts[1])
      )}`;
    }

    const intersectParts = splitTopLevel(query, "∩");
    if (intersectParts) {
      return `${wrapSelect(
        algebraSql(intersectParts[0])
      )} INTERSECT ${wrapSelect(algebraSql(intersectParts[1]))}`;
    }

    const exceptParts = splitTopLevel(query, "-");
    if (exceptParts) {
      return `${wrapSelect(algebraSql(exceptParts[0]))} EXCEPT ${wrapSelect(
        algebraSql(exceptParts[1])
      )}`;
    }

    // Joins
    const joinInfo = splitJoinTopLevel(query);
    if (joinInfo) {
      const { left, right, cond, joinType } = joinInfo;
      if (!cond) {
        return `-- Natural join no soportado; especifique condición: ⋈_{cond}\n${algebraSql(
          left
        )} /* ⋈ */ ${algebraSql(right)}`;
      }
      const leftStr = algebraSql(left);
      const rightStr = algebraSql(right);

      // Try to flatten selections on each side into the WHERE clause
      const parseSel = (s) => {
        const m = s.match(
          /^SELECT \* FROM ([A-Za-z_][A-Za-z0-9_]*)(?: WHERE (.+))?$/i
        );
        if (m) return { table: m[1], where: m[2] || null };
        if (isSimpleTableName(s)) return { table: s, where: null };
        return null;
      };
      const L = parseSel(leftStr);
      const R = parseSel(rightStr);
      if (L && R) {
        const whereParts = [];
        if (L.where) whereParts.push(L.where);
        if (R.where) whereParts.push(R.where);
        const whereClause = whereParts.length
          ? ` WHERE ${whereParts.join(" AND ")}`
          : "";
        return `SELECT * FROM ${L.table} ${joinType} JOIN ${R.table} ON ${cond}${whereClause}`;
      }
      if (L) {
        const whereClause = L.where ? ` WHERE ${L.where}` : "";
        return `SELECT * FROM ${L.table} ${joinType} JOIN (${rightStr}) AS R ON ${cond}${whereClause}`;
      }
      if (R) {
        const whereClause = R.where ? ` WHERE ${R.where}` : "";
        return `SELECT * FROM (${leftStr}) AS L ${joinType} JOIN ${R.table} ON ${cond}${whereClause}`;
      }
      return `SELECT * FROM (${leftStr}) AS L ${joinType} JOIN (${rightStr}) AS R ON ${cond}`;
    }

    // Rename ρ alias(expr)
    const renameMatch = query.match(
      /^ρ\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.+)\)$/
    );
    if (renameMatch) {
      const alias = renameMatch[1].trim();
      const inner = renameMatch[2].trim();
      return `(${algebraSql(inner)}) AS ${alias}`;
    }

    // Selection σ_{cond}(expr) or σ cond (expr)
    const selectMatch = query.match(/^σ\s*[_]?\{?\s*(.+?)\s*\}?\s*\((.+)\)$/);
    if (selectMatch) {
      const condition = selectMatch[1].trim();
      const innerAlgebra = selectMatch[2].trim();
      const innerSql = algebraSql(innerAlgebra);
      if (isSimpleTableName(innerAlgebra)) {
        return `SELECT * FROM ${innerAlgebra} WHERE ${condition}`;
      }
      const simple = innerSql.match(
        /^SELECT \* FROM ([A-Za-z_][A-Za-z0-9_]*) WHERE (.+)$/i
      );
      if (simple) {
        const table = simple[1];
        const innerCondition = simple[2];
        return `SELECT * FROM ${table} WHERE ${innerCondition} AND ${condition}`;
      }
      return `SELECT * FROM (${innerSql}) WHERE ${condition}`;
    }

    // Projection π attrs(expr)
    const proj = query.match(/^π\s*([^(]+)\((.+)\)$/);
    if (proj) {
      const fields = proj[1].trim();
      const innerAlg = proj[2].trim();
      const innerSql = algebraSql(innerAlg);
      if (isSimpleTableName(innerAlg)) {
        return `SELECT ${fields} FROM ${innerAlg}`;
      }
      // Project directly from any SELECT * FROM ... [WHERE ...] form (including joins)
      const anySel = innerSql.match(/^SELECT \* FROM (.+)$/i);
      if (anySel) {
        return `SELECT ${fields} FROM ${anySel[1]}`;
      }
      return `SELECT ${fields} FROM (${innerSql})`;
    }

    // Cartesian product ×
    const cross = splitTopLevel(query, "×");
    if (cross) {
      const left = algebraSql(cross[0]);
      const right = algebraSql(cross[1]);
      if (isSimpleTableName(left) && isSimpleTableName(right)) {
        return `${left} CROSS JOIN ${right}`;
      }
      return `(${left}) CROSS JOIN (${right})`;
    }

    // Simple table name
    if (isSimpleTableName(query)) {
      return query;
    }

    return "No se pudo convertir la expresión de álgebra a SQL.";
  } catch (err) {
    return "Error al convertir álgebra a SQL: " + err.message;
  }
};
