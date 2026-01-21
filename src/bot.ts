import * as mineflayer from 'mineflayer'
import type { Bot as MineflayerBot } from 'mineflayer'
import { EventEmitter } from 'events'
import { sleep, getRandom } from './utils.js'
import CONFIG from '../config.json' assert { type: 'json' }

export type BotState = {
  id: string
  username: string
  online: boolean
  health: number
  food: number
  position: { x: number; y: number; z: number } | null
  yaw?: number
  pitch?: number
  heldItem?: string | null
  lastUpdate: number
  view?: {
    entities: { id: string; type: string; name?: string; position?: { x: number; y: number; z: number } }[]
    lookingAt?: { name: string } | null
  }
  raw?: any
}

class ManagedBots extends EventEmitter {
  private bots: Record<string, MineflayerBot | null> = {}
  private states: Record<string, BotState> = {}

  constructor() {
    super()
  }

  public async init() {
    const list = Array.isArray((CONFIG as any).bots) && (CONFIG as any).bots.length ? (CONFIG as any).bots : [{ id: 'default', client: (CONFIG as any).client }]
    for (const entry of list) {
      const id = entry.id || entry.client?.username || `bot-${Math.random().toString(36).slice(2,8)}`
      this.states[id] = {
        id,
        username: entry.client?.username ?? 'unknown',
        online: false,
        health: 0,
        food: 0,
        position: null,
        lastUpdate: Date.now(),
        view: { entities: [], lookingAt: null }
      }
      this.startBot(id, entry.client || entry)
    }
  }

  private startBot(id: string, cfg: any) {
    let reconnecting = false

    const create = () => {
      const bot = mineflayer.createBot({
        host: cfg.host,
        port: Number(cfg.port) || undefined,
        username: cfg.username || cfg.name,
        version: cfg.version || undefined
      }) as MineflayerBot

      this.bots[id] = bot

      const setStateOnline = (online: boolean) => {
        const s = this.states[id]
        s.online = online
        s.lastUpdate = Date.now()
        this.emit('update', { ...s })
      }

      bot.on('login', () => {
        setStateOnline(true)
        this.states[id].username = bot.username
        this.emit('log', id, `Logged in: ${bot.username}`)
      })

      bot.on('spawn', () => {
        setStateOnline(true)
        this.emit('log', id, 'Spawned')
        this.startActions(id)
      })

      bot.on('health', () => {
        const s = this.states[id]
        s.health = (bot.health as number) ?? s.health
        s.food = (bot.food as number) ?? s.food
        s.lastUpdate = Date.now()
        this.emit('update', { ...s })
      })

      bot.on('move', () => {
        const p = bot.entity?.position
        if (p) {
          const s = this.states[id]
          s.position = { x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) }
          s.yaw = bot.entity.yaw
          s.pitch = bot.entity.pitch
          s.lastUpdate = Date.now()
          this.emit('update', { ...s })
        }
      })

      bot.on('chat', (username, message) => {
        this.emit('chat', id, { username, message })
      })

      bot.on('kicked', (reason) => {
        this.emit('log', id, `Kicked: ${reason}`)
      })

      bot.on('end', () => {
        setStateOnline(false)
        this.emit('log', id, 'Connection ended, scheduling reconnect')
        if (!reconnecting) {
          reconnecting = true
          setTimeout(() => {
            reconnecting = false
            create()
          }, ((CONFIG as any).action?.retryDelay) ?? 5000)
        }
      })

      bot.on('error', (err) => {
        this.emit('log', id, `Error: ${String(err)}`)
      })

      // periodic view update
      const viewLoop = setInterval(() => {
        const s = this.states[id]
        if (!bot || !bot.entity) return
        const entities = Object.values(bot.entities || {})
          .filter(e => e && e.position)
          .slice(0, 20)
          .map(e => ({ id: String(e.id), type: e.type, name: (e.name ?? (e as any).username) as string | undefined, position: { x: Math.floor(e.position.x), y: Math.floor(e.position.y), z: Math.floor(e.position.z) } }))
        s.view = { entities, lookingAt: null }

        try {
          const pos = bot.entity.position
          const block = bot.blockAt ? bot.blockAt(pos) : null
          if (block) s.view.lookingAt = { name: block.name }
        } catch (e) { /* ignore */ }

        s.lastUpdate = Date.now()
        this.emit('update', { ...s })
      }, 2000)

      bot.once('end', () => clearInterval(viewLoop))
    }

    create()
  }

  public getStates() {
    return Object.values(this.states)
  }

  public getState(id: string) {
    return this.states[id] ?? null
  }

  public subscribe(cb: (state: BotState) => void) {
    this.on('update', cb)
    return () => this.off('update', cb)
  }
}

const manager = new ManagedBots()

export default async function initBot() {
  await manager.init()
  // allow web module to import manager via global (avoids circular imports)
  ;(globalThis as any).__ATERBOT_MANAGER = manager
  console.log('Bot manager started')
}

export { manager }
