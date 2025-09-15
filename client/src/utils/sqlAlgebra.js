export const algebraSql = (algebraQuery) => {
  try {
    algebraQuery = algebraQuery.trim();

    const selectFields = algebraQuery.match(/π\s+(.+?)\s*\(/i)?.[1].trim() || "*";

    let whereCondition = null;
    let fromTable = algebraQuery;

    const selMatch = algebraQuery.match(/σ\s+(.+?)\s*\((.+)\)/i);
    if (selMatch) {
      whereCondition = selMatch[1].trim();
      fromTable = selMatch[2].trim();
    } else {
      const tableMatch = algebraQuery.match(/\((.+)\)/);
      fromTable = tableMatch ? tableMatch[1].trim() : fromTable;
    }

    fromTable = fromTable.replace(/^\(+|\)+/g, "").trim();

    return "SELECT " + selectFields + " FROM " + fromTable + (whereCondition ? " WHERE " + whereCondition : "") + ";";

  } catch {
    return "Error al convertir la expresión de álgebra relacional a SQL.";
  }
};


