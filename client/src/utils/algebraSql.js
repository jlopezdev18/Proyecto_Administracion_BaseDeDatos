export const algebraSql = (algebraQuery) => {
  try {
    const projMatch = algebraQuery.match(/π\s+(.+?)\s*\(/i);
    const selectFields = projMatch ? projMatch[1].trim() : "*";

    const selMatch = algebraQuery.match(/σ\s+(.+?)\s*\((.+)\)/i);
    let whereCondition = null;
    let fromTable = "";

    if (selMatch) {
      whereCondition = selMatch[1].trim();
      fromTable = selMatch[2].trim();
    } else {
      const tableMatch = algebraQuery.match(/\((.+)\)/);
      fromTable = tableMatch ? tableMatch[1].trim() : "";
    }

    fromTable = fromTable.replace(/^\(+|\)+$/g, "").trim();

    let sql = `SELECT ${selectFields} FROM ${fromTable}`;
    if (whereCondition) sql += ` WHERE ${whereCondition}`;
    sql += ";";

    return sql; 
  } catch  {
    return "Error al convertir la expresión de álgebra relacional a SQL.";
  }
};  
