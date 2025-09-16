export function sqlAlgebra(sqlQuery) {
  try {
    const query = sqlQuery.trim().replace(/;+/g, "");

    const patterns = {
      union: /(.+)\s+UNION\s+(.+)/i,
      intersect: /(.+)\s+INTERSECT\s+(.+)/i,
      except: /(.+)\s+EXCEPT\s+(.+)/i,
      selectWhere: /SELECT\s+(.+?)\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i,
      simpleSelect: /SELECT\s+(.+?)\s+FROM\s+(\w+)/i,
    };

    // UNION
    if (patterns.union.test(query)) {
      const [, left, right] = query.match(patterns.union);
      return "(" + sqlAlgebra(left) + " ∪ " + sqlAlgebra(right) + ")";
    }

    // INTERSECT
    if (patterns.intersect.test(query)) {
      const [, left, right] = query.match(patterns.intersect);
      return "(" + sqlAlgebra(left) + " ∩ " + sqlAlgebra(right) + ")";
    }

    // EXCEPT
    if (patterns.except.test(query)) {
      const [, left, right] = query.match(patterns.except);
      return "(" + sqlAlgebra(left) + " - " + sqlAlgebra(right) + ")";
    }

    // SELECT con WHERE
    if (patterns.selectWhere.test(query)) {
      const [, fields, table, condition] = query.match(patterns.selectWhere);
      if (fields === "*" || fields.toUpperCase() === "ALL") {
        return "σ" + condition.trim() + "(" + table.trim() + ")";
      }
      return "π" + fields.trim() + "(σ" + condition.trim() + "(" + table.trim() + "))";
    }

    // SELECT simple
    if (patterns.simpleSelect.test(query)) {
      const [, fields, table] = query.match(patterns.simpleSelect);
      if (fields === "*" || fields.toUpperCase() === "ALL") {
        return table.trim();
      }
      return "π" + fields.trim() + "(" + table.trim() + ")";
    }

    return "No se pudo convertir la consulta SQL a algebra.";
  } catch (err) {
    return "Error al convertir SQL a algebra: " + err.message;
  }
}
