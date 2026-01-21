(() => {
  const state = { bots: [], selected: null }
  const listEl = document.getElementById('bots-list')
  const botView = document.getElementById('bot-view')
  const dashboard = document.getElementById('dashboard')
  const botTitle = document.getElementById('bot-title')
  const botOnline = document.getElementById('bot-online')
  const botHealth = document.getElementById('bot-health')
  const botFood = document.getElementById('bot-food')
  const botPos = document.getElementById('bot-pos')
  const botLooking = document.getElementById('bot-looking')
  const entitiesEl = document.getElementById('entities')
  const backBtn = document.getElementById('back')

  function renderList(){
    if(!listEl) return
    listEl.innerHTML = ''
    state.bots.forEach(b => {
      const card = document.createElement('div')
      card.className = 'bot-card'
      card.innerHTML = `<h4>${b.username}</h4>
        <div class="meta">ID: ${b.id}</div>
        <div class="meta">Online: ${b.online ? '✅' : '❌'}</div>
        <div class="meta">HP:${b.health} | Hunger:${b.food}</div>`
      card.addEventListener('click', ()=> showBot(b.id))
      listEl.appendChild(card)
    })
  }

  function showBot(id){
    const bot = state.bots.find(x => x.id === id)
    if(!bot) return
    state.selected = bot
    dashboard.classList.add('hidden')
    botView.classList.remove('hidden')
    botTitle.textContent = `${bot.username} — ${bot.id}`
    updateBotPanel(bot)
  }

  function updateBotPanel(bot){
    botOnline.textContent = bot.online ? 'Online' : 'Offline'
    botHealth.textContent = bot.health
    botFood.textContent = bot.food
    botPos.textContent = bot.position ? `${bot.position.x}, ${bot.position.y}, ${bot.position.z}` : 'N/A'
    botLooking.textContent = bot.view && bot.view.lookingAt ? bot.view.lookingAt.name : '—'
    entitiesEl.innerHTML = ''
    (bot.view?.entities || []).forEach(e=>{
      const li = document.createElement('li')
      li.textContent = `${e.type}${e.name? ' — '+e.name : ''} @ ${e.position ? `${e.position.x},${e.position.y},${e.position.z}` : 'N/A'}`
      entitiesEl.appendChild(li)
    })
  }

  backBtn.addEventListener('click', ()=>{
    state.selected = null
    botView.classList.add('hidden')
    dashboard.classList.remove('hidden')
  })

  // SSE
  const sse = new EventSource('/sse')
  sse.onmessage = (ev) => {
    try {
      const payload = JSON.parse(ev.data)
      if(payload.type === 'init') {
        state.bots = payload.bots || []
        renderList()
      } else if(payload.type === 'update') {
        const s = payload.state
        const idx = state.bots.findIndex(b=>b.id===s.id)
        if(idx === -1) state.bots.push(s)
        else state.bots[idx] = s
        renderList()
        if(state.selected && state.selected.id === s.id) updateBotPanel(s)
      }
    } catch(e){ console.error('SSE parse error', e) }
  }

  sse.onerror = (e) => {
    // attempt reconnect is automatic by EventSource
    console.warn('EventSource error', e)
  }
})();
