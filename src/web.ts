import express from 'express'
import path from 'path'
import { manager } from './bot.js' // will import the exported manager
import type { BotState } from './bot.js'

const app = express()
const PORT = Number(process.env.PORT) || 5500

// Serve static UI
app.use('/', express.static(path.join(process.cwd(), 'public')))

// Simple snapshot endpoints
app.get('/api/bots', (req, res) => {
  res.json(manager.getStates())
})

app.get('/api/bot/:id', (req, res) => {
  const s = manager.getState(req.params.id)
  if (!s) return res.status(404).json({ error: 'Not found' })
  res.json(s)
})

// SSE: push updates to clients
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })
  res.flushHeaders()

  const send = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // send initial snapshot
  send({ type: 'init', bots: manager.getStates() })

  const onUpdate = (state: BotState) => send({ type: 'update', state })
  manager.on('update', onUpdate)

  req.on('close', () => {
    manager.off('update', onUpdate)
  })
})

app.listen(PORT, () => {
  console.log(`Web server ready on http://localhost:${PORT}`)
})
