import express from 'express'
import { logRequest } from './middleware/logging.js'
import { asyncErrorWrapper, handleErrors } from './middleware/errors.js'
import { commitCredit, prepareCredit } from './handlers/credits.js'
import { abortDebit, commitDebit, prepareDebit } from './handlers/debits.js'

const bankName = 'Demo bank'
const port = 3001

const app = express()

app.use(express.json())

app.use(logRequest)

app.get('/', (req, res) => {
  res.send(`${bankName} is running!`)
})

app.post('/v2/credits', asyncErrorWrapper(prepareCredit))
app.post('/v2/credits/:handle/commit', asyncErrorWrapper(commitCredit))

app.post('/v2/debits', asyncErrorWrapper(prepareDebit))
app.post('/v2/debits/:handle/commit', asyncErrorWrapper(commitDebit))
app.post('/v2/debits/:handle/abort', asyncErrorWrapper(abortDebit))

app.use(handleErrors)

app.listen(port, () => {
  console.log(`${bankName} running on port ${port}`)
})
