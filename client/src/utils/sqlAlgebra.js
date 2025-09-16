export const sqlAlgebra = function(sqlQuery) {
  try {
    var query = sqlQuery.trim().replace(/;+/, ""); 

    //Renombramiento ρ 
    var renameMatch = query.match(/FROM\s+([A-Z0-9_]+)\s+AS\s+([A-Z0-9_]+)/i);
    if (renameMatch) {
      var table = renameMatch[1].trim();
      var alias = renameMatch[2].trim();
      query = query.replace(renameMatch[0], "FROM " + table);
      return "ρ " + alias + " (" + sqlAlgebra(query) + ")";
    }

    //Union
    var unionMatch = query.match(/(.+)\s+UNION\s+(.+)/i);
    if (unionMatch) {
      return "(" + sqlAlgebra(unionMatch[1].trim()) + " ∪ " + sqlAlgebra(unionMatch[2].trim()) + ")";
    }

    //Interseccion
    var intersectMatch = query.match(/(.+)\s+INTERSECT\s+(.+)/i);
    if (intersectMatch) {
      return "(" + sqlAlgebra(intersectMatch[1].trim()) + " ∩ " + sqlAlgebra(intersectMatch[2].trim()) + ")";
    }

    //Diferencia
    var exceptMatch = query.match(/(.+)\s+EXCEPT\s+(.+)/i);
    if (exceptMatch) {
      return "(" + sqlAlgebra(exceptMatch[1].trim()) + " - " + sqlAlgebra(exceptMatch[2].trim()) + ")";
    }

    //SELECT + FROM (+ optional WHERE) ---
    var selectMatch = query.match(/SELECT\s+(.+?)\s+FROM\s+(.+)/i);
    if (!selectMatch) return "No se pudo analizar la consulta.";

    var fields = selectMatch[1].trim();
    var fromPart = selectMatch[2].trim();

    //Detectar WHERE
    var where = "";
    var whereMatch = fromPart.match(/(.+)\s+WHERE\s+(.+)/i);
    if (whereMatch) {
      fromPart = whereMatch[1].trim();
      where = whereMatch[2].trim();
    }

    //Detectar CROSS JOIN (producto cartesiano) ---
    var tableExpr = "";
    var crossMatch = fromPart.match(/([A-Z0-9_]+)\s+CROSS\s+JOIN\s+([A-Z0-9_]+)/i);
    if (crossMatch) {
      tableExpr = crossMatch[1].trim() + " × " + crossMatch[2].trim();
    } else {
      tableExpr = fromPart;
    }

    //Construcción de algebra
    var algebra = "";
    if (fields !== "*") {
      algebra = "π " + fields + " (" + tableExpr + ")";
    } else {
      algebra = tableExpr;
    }

    if (where) {
      algebra = "σ " + where + " (" + algebra + ")";
    }

    return algebra;

  } catch (err) {
    return "Error al convertir SQL a álgebra relacional.";
  }
}
