export const algebraSql = function(algebraQuery) {
  try {
    var query = algebraQuery.trim().replace(/;$/, ""); 

    // --- Renombramiento ρ ---
    var renameMatch = query.match(/ρ\s+([a-zA-Z0-9_]+)\s*\(\s*(.+)\s*\)/);
    if (renameMatch) {
      var alias = renameMatch[1].trim();
      var inner = renameMatch[2].trim();

      
      if (/^[a-zA-Z0-9_]+/.test(inner) && inner.length === inner.match(/^[a-zA-Z0-9_]+/)[0].length) {
        return "SELECT * FROM " + inner + " AS " + alias;
      } else {
        return "(" + algebraSql(inner) + ") AS " + alias;
      }
    }

    //Unión ∪
    var unionMatch = query.match(/(.+)\s*∪\s*(.+)/);
    if (unionMatch) {
      return "(" + algebraSql(unionMatch[1].trim()) + ") UNION (" + algebraSql(unionMatch[2].trim()) + ")";
    }

    //Intersección ∩ 
    var intersectMatch = query.match(/(.+)\s*∩\s*(.+)/);
    if (intersectMatch) {
      return "(" + algebraSql(intersectMatch[1].trim()) + ") INTERSECT (" + algebraSql(intersectMatch[2].trim()) + ")";
    }

    //Diferencia - 
    var exceptMatch = query.match(/(.+)\s*-\s*(.+)/);
    if (exceptMatch) {
      return "(" + algebraSql(exceptMatch[1].trim()) + ") EXCEPT (" + algebraSql(exceptMatch[2].trim()) + ")";
    }

    //Selección σ 
    var selectMatch = query.match(/σ\s+([^(]+)\((.+)\)/);
    if (selectMatch) {
      var condition = selectMatch[1].trim();
      var inner = selectMatch[2].trim();
      return "SELECT * FROM (" + algebraSql(inner) + ") WHERE " + condition;
    }

    //Proyección π 
    var projMatch = query.match(/π\s+([^(]+)\((.+)\)/);
    if (projMatch) {
      var fields = projMatch[1].trim();
      var inner = projMatch[2].trim();
      return "SELECT " + fields + " FROM (" + algebraSql(inner) + ")";
    }

    //Producto cartesiano ×
    var crossMatch = query.match(/(.+)\s*×\s*(.+)/);
    if (crossMatch) {
      var left = crossMatch[1].trim();
      var right = crossMatch[2].trim();
      return "(" + algebraSql(left) + ") CROSS JOIN (" + algebraSql(right) + ")";
    }

    //Si solo es un nombre de tabla 
    if (/^[a-zA-Z0-9_]+/.test(query) && query.length === query.match(/^[a-zA-Z0-9_]+/)[0].length) {
      return query;
    }

    return "No se pudo convertir la expresión de álgebra.";

  } catch (err) {
    return "Error al convertir álgebra a SQL.";
  }
}
