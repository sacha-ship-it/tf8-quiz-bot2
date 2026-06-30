cconst { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js')
const fs = require('fs')
const questions = require('./questions')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.QUIZ_CHANNEL_ID
const CLIENT_ID = process.env.CLIENT_ID
const SCORES_FILE = './scores.json'

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

let quizRunning = false
const hasParticipated = new Set()

function loadScores() {
  try {
    if (fs.existsSync(SCORES_FILE)) {
      return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'))
    }
  } catch (e) {
    console.log('No existing scores file, creating one...')
  }
  return {}
}

let globalScores = loadScores()

let writeQueue = Promise.resolve()
let pendingWrite = false

function saveScores() {
  if (pendingWrite) return
  pendingWrite = true

  writeQueue = writeQueue.then(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          fs.writeFileSync(SCORES_FILE, JSON.stringify(globalScores, null, 2))
        } catch (e) {
          console.error('Error writing scores file:', e)
        }
        pendingWrite = false
        resolve()
      }, 500)
    })
  })
}

async function sendQuestionsToParticipant(interaction) {
  const userId = interaction.user.id
  const username = interaction.user.username

  if (!globalScores[userId]) {
    globalScores[userId] = { username, score: 0, correct: 0, wrong: 0, quizzesPlayed: 0 }
  }

  let quizScore = 0
  let quizCorrect = 0
  let quizWrong = 0

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`q${i}_A_${userId}`).setLabel('A').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_B_${userId}`).setLabel('B').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_C_${userId}`).setLabel('C').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_D_${userId}`).setLabel('D').setStyle(ButtonStyle.Primary),
    )

    await interaction.followUp({
      embeds: [new EmbedBuilder()
        .setTitle(`🧠 Question ${i + 1} / ${questions.length}`)
        .setDescription(q.question + '\n\n' + q.choices.join('\n'))
        .setColor('#0099ff')
        .setFooter({ text: '⏱️ 10 seconds to answer!' })],
      components: [row],
      ephemeral: true
    })

    const startTime = Date.now()
    let answeredCorrectly = null
    let answerFeedback = ''

    await new Promise(resolve => {
      const filter = i2 => i2.customId.endsWith(`_${userId}`) && i2.user.id === userId
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000, max: 1 })

      collector.on('collect', async i2 => {
        const choice = i2.customId.split('_')[1]
        const speed = Math.max(0, Math.round((10000 - (Date.now() - startTime)) / 1000))

        if (choice === q.answer) {
          const pts = 10 + speed
          quizScore += pts
          quizCorrect += 1
          answeredCorrectly = true
          answerFeedback = `✅ Correct answer! +${pts} pts (including +${speed} speed bonus)`
        } else {
          quizWrong += 1
          answeredCorrectly = false
          answerFeedback = `❌ Wrong answer! The correct answer was ${q.answer}: ${q.choices.find(c => c.startsWith(q.answer))}`
        }

        await i2.deferUpdate()
        collector.stop()
      })

      collector.on('end', async (collected, reason) => {
        if (collected.size === 0) {
          answerFeedback = `⏱️ Time's up! The correct answer was ${q.answer}: ${q.choices.find(c => c.startsWith(q.answer))}`
          quizWrong += 1
        }

        // Show the result of THIS question first, separately from the next question
        await interaction.followUp({ content: answerFeedback, ephemeral: true })

        // Pause before the next question appears, to avoid overlap between feedback and next question
        setTimeout(resolve, 2000)
      })
    })
  }

  globalScores[userId].score += quizScore
  globalScores[userId].correct += quizCorrect
  globalScores[userId].wrong += quizWrong
  globalScores[userId].quizzesPlayed += 1
  globalScores[userId].username = username
  saveScores()

  await interaction.followUp({
    embeds: [new EmbedBuilder()
      .setTitle('🏁 Quiz completed!')
      .setDescription(`Score for this quiz: ${quizScore} pts\n✅ Correct answers: ${quizCorrect}\n❌ Wrong answers: ${quizWrong}\n\nCome back next week for a new quiz!`)
      .setColor('#00FF00')],
    ephemeral: true
  })
}

async function startQuiz(commandInteraction) {
  if (quizRunning) {
    await commandInteraction.reply({ content: '⚠️ A quiz is already running! Use /endquiz to end it.', ephemeral: true })
    return
  }

  if (questions.length === 0) {
    await commandInteraction.reply({ content: '❌ No questions configured for this week.', ephemeral: true })
    return
  }

  quizRunning = true
  hasParticipated.clear()

  const channel = await client.channels.fetch(CHANNEL_ID)

  const startRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('start_quiz')
      .setLabel('🧠 Start the quiz')
      .setStyle(ButtonStyle.Success)
  )

  await channel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🧠 THE FLOOR 8 QUIZ OF THE WEEK')
      .setDescription('This week\'s quiz is now available!\n\n🔒 Questions are private, nobody can see your answers.\n\nClick the button below to start 👇\n\n⏱️ You have 10 seconds per question.')
      .setColor('#FFD700')
      .setFooter({ text: 'A new quiz every week 🧠' })],
    components: [startRow]
  })

  await commandInteraction.reply({ content: '✅ This week\'s quiz has been launched in the dedicated channel!', ephemeral: true })

  const filter = i => i.customId === 'start_quiz'
  const collector = channel.createMessageComponentCollector({ filter, time: 604800000 })

  collector.on('collect', async interaction => {
    const userId = interaction.user.id

    if (hasParticipated.has(userId)) {
      return interaction.reply({ content: '❌ You\'ve already taken this week\'s quiz! Come back next week.', ephemeral: true })
    }

    hasParticipated.add(userId)
    await interaction.reply({ content: '🚀 The quiz is starting! Questions are on their way...', ephemeral: true })
    sendQuestionsToParticipant(interaction)
  })

  collector.on('end', async () => {
    quizRunning = false
  })
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('quiz')
      .setDescription('Launch this week\'s quiz')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('classement')
      .setDescription('Show the overall leaderboard')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('endquiz')
      .setDescription('End the current quiz')
      .toJSON()
  ]

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  console.log('Commands /quiz, /classement and /endquiz registered')
}

client.on('ready', async () => {
  console.log(`Bot connected: ${client.user.tag}`)
  await registerCommands()
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === 'quiz') {
    startQuiz(interaction)
  }

  if (interaction.commandName === 'classement') {
    globalScores = loadScores()

    const top = Object.entries(globalScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10)

    const medals = ['🥇', '🥈', '🥉']
    const classement = top.length
      ? top.map(([id, data], i) =>
          `${medals[i] || `${i + 1}.`} ${data.username}: ${data.score} pts (${data.quizzesPlayed} quizzes played)`
        ).join('\n')
      : 'No participants yet.'

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🏆 OVERALL LEADERBOARD')
        .setDescription(classement)
        .setColor('#FFD700')],
      ephemeral: false
    })
  }

  if (interaction.commandName === 'endquiz') {
    if (quizRunning) {
      quizRunning = false
      hasParticipated.clear()
      await interaction.reply({ content: '✅ The quiz has been manually ended. You can launch a new one with /quiz.', ephemeral: true })
    } else {
      await interaction.reply({ content: '⚠️ No quiz currently running.', ephemeral: true })
    }
  }
})

client.login(TOKEN)
