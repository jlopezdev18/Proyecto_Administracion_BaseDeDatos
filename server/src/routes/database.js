const express = require('express')
const router = express.Router()
const {
	listDatabases,
	getTablesMetadataForDatabase,
	getDatabaseRelations,
	getTableNames,
	getColumnsNames,
	getGeneralizations
} = require('../controllers/databaseController')


router.get('/databases', listDatabases)
router.get('/databases/:dbName/tables/names', getTableNames)
router.get('/databases/:dbName/columns', getColumnsNames)
router.get('/databases/:dbName/tables', getTablesMetadataForDatabase)
router.get('/databases/:dbName/relations', getDatabaseRelations)
router.get('/databases/:dbName/generalizations', getGeneralizations)


module.exports = router
