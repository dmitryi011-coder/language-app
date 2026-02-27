let currentLanguage = null

document.querySelector('#app').innerHTML = `
<div class="screen">
  <h1>Language App</h1>
  <button id="addLang">Добавить язык</button>
  <div id="languages"></div>
</div>
`;

const languagesContainer = document.querySelector('#languages')

let languages = JSON.parse(localStorage.getItem('languages')) || []

function renderLanguages() {
languagesContainer.innerHTML = ''
  languages.forEach((lang, index) => {
    const btn = document.createElement('button')
btn.addEventListener('click', () => {
  currentLanguage = lang
  renderLanguageScreen()
})


    btn.textContent = lang
    btn.style.display = 'block'
    btn.style.marginTop = '10px'
    languagesContainer.appendChild(btn)
  })
}

document.querySelector('#addLang').addEventListener('click', () => {
  const name = prompt('Введите название языка')
  if (name) {
    languages.push(name)
    localStorage.setItem('languages', JSON.stringify(languages))
    renderLanguages()
  }
})

renderLanguages()
function renderLanguageScreen() {
  document.querySelector("#app").innerHTML = `
  <div class="screen">
    <h1>${currentLanguage}</h1>
    <button id="addWord">Добавить слово</button>
    <button id="library" style="margin-left:10px;">Библиотека</button>

    <button id="startLearning" style="margin-left:10px;">Начать изучение</button>
    <button id="reviewArchive" style="margin-left:10px;">Повтор архива</button>

    <div style="margin-top:20px;">
      <button id="back">Назад</button>
    </div>
  </div>
`;
document.querySelector('#addWord').addEventListener('click', () => {
  const front = prompt('RU (что показываем)?')
  if (!front) return

  const answer = prompt('SL (правильный ответ)?')
  if (!answer) return

  const note = prompt('Заметка (род/формы) — можно пусто') || ''

  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []

  cards.push({
    id: crypto.randomUUID(),
    front,
    answer,
    note,
    state: 'LEARN',
    learnSeen: 0,
    quizWinStreak: 0,
    quizLoseStreak: 0,
    recallWinStreak: 0,
    recallLoseStreak: 0
  })

  localStorage.setItem(key, JSON.stringify(cards))
  
})
document.querySelector('#library').addEventListener('click', () => {
  renderLibraryScreen()
})
document.querySelector('#startLearning').addEventListener('click', () => {
  startLearning()

})
document.querySelector('#reviewArchive').addEventListener('click', () => {
  startArchiveMode()
})

  document.querySelector('#back').addEventListener('click', () => {
    currentLanguage = null
    location.reload()
  })
}
function renderLibraryScreen() {
  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []

  let listHtml = cards.map(c => `
  <div class="screen">
    <div><b>RU:</b> ${c.front}</div>
    <div><b>SL:</b> ${c.answer}</div>
    <div><b>Note:</b> ${c.note || ''}</div>
    <div><b>State:</b> ${c.state}</div>

    <button data-del="${c.id}" style="margin-top:8px;">Удалить</button>
  </div>
`).join('')
  if (!cards.length) listHtml = `<p>Пока пусто</p>`

  document.querySelector('#app').innerHTML = `
    <div style="padding:20px; font-family:Arial;">
      <h1>${currentLanguage} — Библиотека</h1>
      ${listHtml}
      <div style="margin-top:20px;">
        <button id="backToLang">Назад</button>
      </div>
    </div>
  `

  document.querySelector('#backToLang').addEventListener('click', () => {
    renderLanguageScreen()
  })

  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del')
      const next = cards.filter(c => c.id !== id)
      localStorage.setItem(key, JSON.stringify(next))
      renderLibraryScreen()
    })
  })
}
function renderLearnScreen() {
  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []

  const learnCards = cards.filter(c => c.state === 'LEARN')

if (!learnCards.length) {
  startLearning()
  return
}


  const card = learnCards[Math.floor(Math.random() * learnCards.length)]

  document.querySelector('#app').innerHTML = `
    <div class="screen">
      <h2>${currentLanguage} — Обучение</h2>
      <div style="margin-top:20px; font-size:22px;">
        ${card.front}
      </div>
      <div style="margin-top:10px; color:gray;">
        ${card.answer}
      </div>
      <div style="margin-top:10px; font-size:12px;">
        ${card.note || ''}
      </div>
      <div style="margin-top:20px;">
        <button id="nextCard">Дальше</button>
        <button id="exitLearn" style="margin-left:10px;">Назад</button>
      </div>
    </div>
  `

  document.querySelector('#nextCard').addEventListener('click', () => {
    card.learnSeen += 1

    if (card.learnSeen >= 5) {
      card.state = 'QUIZ'
    }

    localStorage.setItem(key, JSON.stringify(cards))
    startLearning()

  })

  document.querySelector('#exitLearn').addEventListener('click', () => {
    renderLanguageScreen()
  })
}
function startLearning() {
  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []

  const L = cards.filter(c => c.state === 'LEARN')
  const Q = cards.filter(c => c.state === 'QUIZ')
  const R = cards.filter(c => c.state === 'RECALL')

  // если в режиме изучения вообще нет слов (ARCHIVE игнорируем)
  if (!L.length && !Q.length && !R.length) {
    document.querySelector('#app').innerHTML = `
      <div class="screen">
        <h2>${currentLanguage}</h2>
        <p>Нет слов для изучения (всё в архиве или пусто).</p>
        <button id="backHome">Назад</button>
      </div>
    `
    document.querySelector('#backHome').addEventListener('click', () => {
      renderLanguageScreen()
    })
    return
  }

  // выбираем между LEARN/QUIZ/RECALL пропорционально количеству
  const wLearn = L.length
  const wQuiz = Q.length
  const wRecall = R.length
  const sum = wLearn + wQuiz + wRecall

  const r = Math.random() * sum
  if (r < wLearn) renderLearnScreen()
  else if (r < wLearn + wQuiz) renderQuizScreen()
  else renderRecallScreen()
}





function renderQuizScreen() {
  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []

  const quizCards = cards.filter(c => c.state === 'QUIZ')
  if (!quizCards.length) {
    startLearning()
    return
  }

  const card = quizCards[Math.floor(Math.random() * quizCards.length)]

  // Берём все возможные ответы (из любых стадий)
  const allAnswers = cards.map(c => c.answer)
  const wrongAnswers = allAnswers.filter(a => a !== card.answer)

  const shuffledWrong = wrongAnswers.sort(() => 0.5 - Math.random())
  const options = [card.answer, ...shuffledWrong.slice(0, 3)].sort(() => 0.5 - Math.random())

  document.querySelector('#app').innerHTML = `
  <div class="screen">
      <h2>${currentLanguage} — Квиз</h2>
      <div style="margin-top:20px; font-size:22px;">
        ${card.front}
      </div>
      <div style="margin-top:20px;">
        ${options
          .map(o => `<button class="quizOption" style="display:block; margin-top:10px;">${o}</button>`)
          .join('')}
      </div>
      <div style="margin-top:20px;">
        <button id="exitQuiz">Назад</button>
      </div>
    </div>
  `

  document.querySelectorAll('.quizOption').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.textContent === card.answer) {
        card.quizWinStreak += 1
        card.quizLoseStreak = 0

        // 3 верных подряд → RECALL
        if (card.quizWinStreak >= 3) {
          card.state = 'RECALL'
          card.quizWinStreak = 0
          card.quizLoseStreak = 0
        }
      } else {
        card.quizLoseStreak += 1
        card.quizWinStreak = 0

        alert(`Неправильно ❌\nПравильно: ${card.answer}\n${card.note || ''}`)

        // 2 ошибки подряд → LEARN
        if (card.quizLoseStreak >= 2) {
          card.state = 'LEARN'
          card.learnSeen = 0
          card.quizWinStreak = 0
          card.quizLoseStreak = 0
        }
      }

      localStorage.setItem(key, JSON.stringify(cards))
      startLearning()
    })
  })

  document.querySelector('#exitQuiz').addEventListener('click', () => {
    renderLanguageScreen()
  })
}

function renderRecallScreen() {
  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []
const recallCards = cards.filter(c => c.state === 'RECALL')


if (!recallCards.length) {
  renderLanguageScreen()
  return
}

let card = recallCards[Math.floor(Math.random() * recallCards.length)]
const lastId = localStorage.getItem(`lastCard:${currentLanguage}`)
if (lastId && recallCards.length > 1) {
  let tries = 0
  while (card.id === lastId && tries < 10) {
    card = recallCards[Math.floor(Math.random() * recallCards.length)]
    tries += 1
  }
}
localStorage.setItem(`lastCard:${currentLanguage}`, card.id)


  document.querySelector('#app').innerHTML = `
<div class="screen">
      <h2>${currentLanguage} — Проверка</h2>
      <div style="margin-top:20px; font-size:22px;">
        ${card.front}
      </div>
      <div style="margin-top:20px;">
        <button id="know">Знаю</button>
        <button id="dontKnow" style="margin-left:10px;">Не знаю</button>
        <button id="exitArchive" style="margin-left:10px;">Назад</button>
      </div>
    </div>
  `

  document.querySelector('#know').addEventListener('click', () => {
    // ничего не меняем, просто дальше
card.recallWinStreak += 1

// 5 верных подряд → ARCHIVE
if (card.recallWinStreak >= 5) {
  card.state = 'ARCHIVE'
  card.recallWinStreak = 0
}

localStorage.setItem(key, JSON.stringify(cards))
renderRecallScreen()


  })
document.querySelector('#dontKnow').addEventListener('click', () => {
  card.state = 'QUIZ'
  card.recallWinStreak = 0
  card.quizWinStreak = 0
  card.quizLoseStreak = 0

  localStorage.setItem(key, JSON.stringify(cards))
  renderRecallScreen()
})



  document.querySelector('#exitArchive').addEventListener('click', () => {
    renderLanguageScreen()
  })
}
function startArchiveMode() {
  const key = `cards:${currentLanguage}`
  const cards = JSON.parse(localStorage.getItem(key)) || []

  const archiveCards = cards.filter(c => c.state === 'ARCHIVE')

  if (!archiveCards.length) {
    alert('В архиве нет слов')
    renderLanguageScreen()
    return
  }

  const card = archiveCards[Math.floor(Math.random() * archiveCards.length)]

  document.querySelector('#app').innerHTML = `
<div class="screen">
      <h2>${currentLanguage} — Повтор архива</h2>
      <div style="margin-top:20px; font-size:22px;">
        ${card.front}
      </div>
      <div style="margin-top:20px;">
        <button id="know">Знаю</button>
        <button id="dontKnow" style="margin-left:10px;">Не знаю</button>
        <button id="exitArchive" style="margin-left:10px;">Назад</button>
      </div>
    </div>
  `

  document.querySelector('#know').addEventListener('click', () => {
    startArchiveMode()
  })

  document.querySelector('#dontKnow').addEventListener('click', () => {
    card.state = 'QUIZ'
card.learnSeen = 0
card.quizWinStreak = 0
card.quizLoseStreak = 0
card.recallWinStreak = 0

localStorage.setItem(key, JSON.stringify(cards))
startArchiveMode()
  })

  document.querySelector('#exitArchive').addEventListener('click', () => {
    renderLanguageScreen()
  })
}