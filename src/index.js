import express from 'express'
import { logRequest } from './middleware/logging.js'
import { handleErrors } from './middleware/errors.js'

const bankName = 'Demo bank'
const port = 3001

const app = express()

app.use(express.json())

app.use(logRequest)

app.get('/', (req, res) => {
  res.send(`${bankName} is running!`)
})

app.use(handleErrors)

app.listen(port, () => {
  console.log(`${bankName} running on port ${port}`)
})
