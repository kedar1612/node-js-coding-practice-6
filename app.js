const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()
app.use(express.join())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      fileName: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running ')
    })
  } catch (Error) {
    console.log(`DB Error: ${Error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertStateObjectToResponseObject = async dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDistrictObjectToResponseObject = async dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
const convertReportToResponse = (async(newObject) = {
  return: {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  },
})

app.get('/states/', async (request, response) => {
  const allStates = `
    SELECT 
        *
    FROM
        state 
    ORDER BY state_id;`
  const stateList = await database.all(allStates)
  const stateResult = stateList.map(eachObject => {
    return convertStateObjectToResponseObject(eachObject)
  })
  response.send(stateResult)
})

app.get('/states/:stateId', async (request, response) => {
  const getStatesIdQuery = `
                SELECT 
                    *
                FROM 
                    state
                WHERE 
                    state_id = ${stateId};`
  const newState = await database(getStatesIdQuery)
  const stateResult = convertStateObjectToResponseObject(newState)
  response.send(stateResult)
})

app.post('/districts/', async (request, response) => {
  const createDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = createDistrict
  const newDistrict = `
        INSERT INTO
            district {district_name,state_id,cases,cured,active,deaths}
        VALUES
            ('${districtName}',
              ${stateId},
              ${cases},
              ${cured},
              ${active},
              ${deaths}
            );`
  const addDistrict = await database.run(newDistrict)
  const districtId = addDistrict.lastId
  response.send('District Successfully Added')
})
app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
            SELECT
                * 
            FROM 
               district
            WHERE
                district_id = ${districtId};`
  const newDistrict = await database.get(getDistrict)
  response.send(convertDistrictObjectToResponseObject(newDistrict))
})

app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
        DELETE
        FROM 
            district
        WHERE 
            district_id = ${districtId};`
  await database.run(deleteDistrict)
  response.send('District Removed')
})

app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const districtDetail = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetail
  const updateDistrictDetails = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases= ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE 
            district_id = ${districtId};
    `
  await database.run(updateDistrictDetails)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getStateReport = `
        SELECT
            SUM(cases) AS cases,
            SUM(cured) AS cured,
            SUM(active) AS active,
            SUM(deaths) AS deaths
        FROM 
            district
        WHERE
            state_id = ${stateId};`
  const stateReport = await database.get(getStateReport)
  const resultReport = convertReportToResponse(stateReport)
  response.send(resultReport)
})

app.get('/districts/:districtId/details', async (request, response) => {
  const {districtId} = request.params
  const stateDetails = `
        SELECT 
            state_name
        FROM state JOIN district
        ON state.state_id = district.state_id
        WHERE 
            district.district_id = ${districtId};
    `
})

module.exports = app
