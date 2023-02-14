import express from 'express'
import { logRequest } from './middleware/logging.js'
import { asyncErrorWrapper, handleErrors } from './middleware/errors.js'
import { abortCredit, commitCredit, prepareCredit } from './handlers/credits.js'
import { abortDebit, commitDebit, prepareDebit } from './handlers/debits.js'
import { updateIntent } from './handlers/intents.js'

import * as persistence from './persistence.js'

process.on('exit', async () => {
  await persistence.shutdown()
})

await persistence.init()

const bankName = 'Demo bank'
const port = 3001

const app = express()

app.use(express.json())

app.use(logRequest)

app.get('/', (req, res) => {
  res.send(`${bankName} is running!`)
})

app.post('/credits', asyncErrorWrapper(prepareCredit))
app.post('/credits/:handle/commit', asyncErrorWrapper(commitCredit))
app.post('/credits/:handle/abort', asyncErrorWrapper(abortCredit))

app.post('/debits', asyncErrorWrapper(prepareDebit))
app.post('/debits/:handle/commit', asyncErrorWrapper(commitDebit))
app.post('/debits/:handle/abort', asyncErrorWrapper(abortDebit))

app.put('/intents/:handle', asyncErrorWrapper(updateIntent))

app.use(handleErrors)

app.listen(port, () => {
  console.log(`${bankName} running on port ${port}`)
})
