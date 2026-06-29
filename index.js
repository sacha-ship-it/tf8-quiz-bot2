const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js')
const questions = require('./questions')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.QUIZ_CHANNEL_ID
const CLIENT_ID = process.env.CLIENT_ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

let quizRunning = false
const participantScores = {}
const hasParticipated = new Set()

async function sendQuestionsToParticipant(interaction) {
  const userId = interaction.user.id
  const username = interaction.user.username

  if (!participantScores[userId]) {
    participantScores[userId] = { username, score: 0, correct: 0, wrong: 0 }
  }

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
        .setTitle(`❓ Question ${i + 1} / ${questions.length}`)
        .setDescription(q.question + '\n\n' + q.choices.join('\n'))
        .setColor('#0099ff')
        .setFooter({ text: '⏱️ 10 seconds to answer!' })],
      components: [row],
      ephemeral: true
    })

    const startTime = Date.now()

    await new Promise(resolve => {
      const filter = i2 => i2.customId.endsWith(`_${userId}`) && i2.user.id === userId
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000, max: 1 })

      collector.on('collect', async i2 => {
        const choice = i2.customId.split('_')[1]
        const speed = Math.max(0, Math.round((10000 - (Date.now() - startTime)) / 1000))

        if (choice === q.answer) {
          const pts = 10 + speed
          participantScores[userId].score += pts
          participantScores[userId].correct += 1
          await i2.reply({ content: `✅ Correct answer! **+${pts} pts** (including +${speed} pts speed bonus)`, ephemeral: true })
        } else {
          participantScores[userId].wrong += 1
          await i2.reply({ content: `❌ Wrong answer! The correct answer was **${q.answer}** — ${q.choices.find(c => c.startsWith(q.answer))}`, ephemeral: true })
        }

        collector.stop()
      })

      collector.on('end', () => resolve())
    })
  }

  await interaction.followUp({
    embeds: [new EmbedBuilder()
      .setTitle('✅ Quiz completed!')
      .setDescription(`**Score: ${participantScores[userId].score} pts**\n✅ ${participantScores[userId].correct} correct answers\n❌ ${participantScores[userId].wrong} wrong answers`)
      .setColor('#00FF00')],
    ephemeral: true
  })
}

async function startQuiz(commandInteraction) {
  if (quizRunning) {
    await commandInteraction.reply({ content: '⚠️ A quiz is already in progress! Use /endquiz to force end it.', ephemeral: true })
    return
  }

  quizRunning = true
  Object.keys(participantScores).forEach(k => delete participantScores[k])
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
      .setTitle('🧠 TRADING QUIZ — ARE YOU READY?')
      .setDescription('This week\'s quiz is now available!\n\n🔒 Questions are **private** — nobody can see your answers.\n\nClick the button below to start 👇\n\n⏱️ You have **10 seconds** per question.')
      .setColor('#FFD700')],
    components: [startRow]
  })

  await commandInteraction.reply({ content: '✅ The quiz has been launched in the dedicated channel!', ephemeral: true })

  const filter = i => i.customId === 'start_quiz'
  const collector = channel.createMessageComponentCollector({ filter, time: 7200000 })

  collector.on('collect', async interaction => {
    const userId = interaction.user.id

    if (hasParticipated.has(userId)) {
      return interaction.reply({ content: '❌ You have already participated in this week\'s quiz!', ephemeral: true })
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
      .setDescription('Launch this week\'s trading quiz')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('classement')
      .setDescription('Display the current quiz leaderboard')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('endquiz')
      .setDescription('Force end the current quiz')
      .toJSON()
  ]

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  console.log('✅ Commands /quiz, /classement and /endquiz registered')
}

client.on('ready', async () => {
  console.log(`✅ Bot connected: ${client.user.tag}`)
  await registerCommands()

  setInterval(() => {
    const now = new Date()
    if (now.getDay() === 5 && now.getHours() === 16 && now.getMinutes() === 0) {
      client.channels.fetch(CHANNEL_ID).then(channel => startQuiz({ reply: async () => {} }))
    }
  }, 60000)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === 'quiz') {
    startQuiz(interaction)
  }

  if (interaction.commandName === 'classement') {
    const top = Object.entries(participantScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10)

    const medals = ['🥇', '🥈', '🥉']
    const classement = top.length
      ? top.map(([id, data], i) =>
          `${medals[i] || `${i + 1}.`} **${data.username}** — ${data.score} pts (${data.correct} correct / ${data.wrong} wrong)`
        ).join('\n')
      : 'No participants yet.'

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🏆 QUIZ LEADERBOARD')
        .setDescription(classement)
        .setColor('#FFD700')],
      ephemeral: false
    })
  }

  if (interaction.commandName === 'endquiz') {
    if (quizRunning) {
      quizRunning = false
      hasParticipated.clear()
      await interaction.reply({ content: '✅ The quiz has been manually ended. You can now start a new one with /quiz.', ephemeral: true })
    } else {
      await interaction.reply({ content: '⚠️ No quiz is currently running.', ephemeral: true })
    }
  }
})

client.login(TOKEN)
