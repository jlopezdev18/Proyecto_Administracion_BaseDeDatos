export const algebraSql = function (algebraQuery) {
  try {
    var query = algebraQuery.trim().replace(/;+/g, "");

    //Normalizar simbolos logicos
    var normalizedQuery = query.replace(/∧/g, " AND ").replace(/∨/g, " OR ");

    function separarPorOperador(str, operator) {
      var level = 0;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === "(") level++;
        else if (str[i] === ")") level--;
        else if (level === 0 && str.slice(i, i + operator.length) === operator) {
          return [str.slice(0, i).trim(), str.slice(i + operator.length).trim()];
        }
      }
      return null;
    }

    //Union ∪
    var unionParts = separarPorOperador(normalizedQuery, "∪");
    if (unionParts) {
      return algebraSql(unionParts[0]) + " UNION " + algebraSql(unionParts[1]);
    }

    //Interseccion ∩
    var intersectParts = separarPorOperador(normalizedQuery, "∩");
    if (intersectParts) {
      return algebraSql(intersectParts[0]) + " INTERSECT " + algebraSql(intersectParts[1]);
    }

    //Diferencia -
    var exceptParts = separarPorOperador(normalizedQuery, "-");
    if (exceptParts) {
      return algebraSql(exceptParts[0]) + " EXCEPT " + algebraSql(exceptParts[1]);
    }

    //Renombramiento ρ 
    var renameMatch = normalizedQuery.match(/^ρ\s*([a-zA-Z0-9]+)\s*\((.+)\)$/);
    if (renameMatch) {
      var alias = renameMatch[1].trim();
      var inner = renameMatch[2].trim();
      return "(" + algebraSql(inner) + ") AS " + alias;
    }

    //Seleccion σ
    var selectMatch = normalizedQuery.match(/^σ\s*(.+)\((.+)\)$/);
    if (selectMatch) {
      var condition = selectMatch[1].trim();
      var innerAlgebra = selectMatch[2].trim();
      var innerSql = algebraSql(innerAlgebra);

      // Si innerAlgebra es solo una tabla : SELECT directo
      if (/^[a-zA-Z0-9]+$/.test(innerAlgebra)) {
        return "SELECT * FROM " + innerAlgebra + " WHERE " + condition;
      }

      // Si innerSql es un SELECT simple de tabla : combinar sin parentesis
      var selectSimpleMatch = innerSql.match(/^SELECT \* FROM ([a-zA-Z0-9]+) WHERE (.+)$/i);
      if (selectSimpleMatch) {
        var table = selectSimpleMatch[1];
        var innerCondition = selectSimpleMatch[2];
        return "SELECT * FROM " + table + " WHERE " + innerCondition + " AND " + condition;
      }

      //Caso general : mantener parentesis
      return "SELECT * FROM (" + innerSql + ") WHERE " + condition;
    }

    //Proyeccion π
    var projMatch = normalizedQuery.match(/^π\s*([^(]+)\((.+)\)$/);
    if (projMatch) {
      var fields = projMatch[1].trim();
      var innerAlgebra = projMatch[2].trim();
      var innerSql = algebraSql(innerAlgebra);

      //Si innerAlgebra es solo una tabla : SELECT directo sin parentesis
      if (/^[a-zA-Z0-9]+$/.test(innerAlgebra)) {
        return "SELECT " + fields + " FROM " + innerAlgebra;
      }

      //Si innerSql es un SELECT simple de tabla : combinar sin parentesis
      var selectSimpleMatch = innerSql.match(/^SELECT \* FROM ([a-zA-Z0-9]+) WHERE (.+)$/i);
      if (selectSimpleMatch) {
        var table = selectSimpleMatch[1];
        var condition = selectSimpleMatch[2];
        return "SELECT " + fields + " FROM " + table + " WHERE " + condition;
      }

      //Caso general:mantener parentesis
      return "SELECT " + fields + " FROM (" + innerSql + ")";
    }

    //Producto cartesiano ×
    var crossParts = separarPorOperador(normalizedQuery, "×");
    if (crossParts) {
      return algebraSql(crossParts[0]) + " CROSS JOIN " + algebraSql(crossParts[1]);
    }

    //Si solo es un nombre de tabla
    if (/^[a-zA-Z0-9]+$/.test(normalizedQuery)) {
      return normalizedQuery;
    }

    return "No se pudo convertir la expresion de algebra a SQL."
  } catch (err) {
    return "Error al convertir álgebra a SQL: " + err.message;
  }
}
