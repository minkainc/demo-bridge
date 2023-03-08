import express from 'express'

const app = express()
const bankName = 'Demo bank'
const port = 3001

app.get('/', (req, res) => {
  res.send(`${bankName} is running!`)
})

app.listen(port, () => {
  console.log(`${bankName} running on port ${port}`)
})
