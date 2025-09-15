const express = require('express')
const router = express.Router()
const {
	listDatabases,
	getTablesMetadataForDatabase,
	getDatabaseRelations,
	getTableNames,
	getColumnsNames
} = require('../controllers/databaseController')


router.get('/databases', listDatabases)
router.get('/databases/:dbName/tables/names', getTableNames)
router.get('/databases/:dbName/columns', getColumnsNames)
router.get('/databases/:dbName/tables', getTablesMetadataForDatabase)
router.get('/databases/:dbName/relations', getDatabaseRelations)


module.exports = router
