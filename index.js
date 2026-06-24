const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js')
const questions = require('./questions')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.QUIZ_CHANNEL_ID
const CLIENT_ID = process.env.CLIENT_ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

let scores = {}
let quizRunning = false

async function startQuiz(announcementChannel) {
  if (quizRunning) {
    await announcementChannel.send({ content: '⚠️ Un quiz est déjà en cours !', ephemeral: false })
    return
  }

  quizRunning = true
  scores = {}

  // Message d'annonce visible par tout le monde
  await announcementChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🧠 QUIZ TRADING — DANS 30 SECONDES !')
      .setDescription('Préparez-vous ! Vous avez **10 secondes** par question.\n\n🔒 Les questions et réponses sont **privées** — visible uniquement par vous !\n\nCliquez sur le bouton ci-dessous pour participer 👇')
      .setColor('#FFD700')]
  })

  await new Promise(r => setTimeout(r, 30000))

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const answered = new Set()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`q${i}_A`).setLabel('A').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_B`).setLabel('B').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_C`).setLabel('C').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`q${i}_D`).setLabel('D').setStyle(ButtonStyle.Primary),
    )

    // La question est éphémère — visible uniquement par la personne qui interagit
    await announcementChannel.send({
      content: `**❓ Question ${i + 1} / ${questions.length}**\n\n${q.question}\n\n${q.choices.join('\n')}\n\n⏱️ *10 secondes !*`,
      components: [row]
    })

    const startTime = Date.now()

    // Collecteur d'interactions sur le canal
    const collector = announcementChannel.createMessageComponentCollector({ time: 10000 })

    collector.on('collect', async interaction => {
      if (answered.has(interaction.user.id)) {
        return interaction.reply({
          content: '❌ Tu as déjà répondu à cette question !',
          ephemeral: true
        })
      }

      answered.add(interaction.user.id)
      const choice = interaction.customId.split('_')[1]
      const speed = Math.max(0, Math.round((10000 - (Date.now() - startTime)) / 1000))

      if (!scores[interaction.user.id]) {
        scores[interaction.user.id] = { username: interaction.user.username, score: 0, correct: 0, wrong: 0 }
      }

      if (choice === q.answer) {
        const pts = 10 + speed
        scores[interaction.user.id].score += pts
        scores[interaction.user.id].correct += 1
        await interaction.reply({
          content: `✅ Bonne réponse ! **+${pts} pts** (dont +${speed} pts rapidité)`,
          ephemeral: true
        })
      } else {
        scores[interaction.user.id].wrong += 1
        await interaction.reply({
          content: `❌ Mauvaise réponse ! La bonne réponse était **${q.answer}** — ${q.choices.find(c => c.startsWith(q.answer))}`,
          ephemeral: true
        })
      }
    })

    await new Promise(r => setTimeout(r, 11000))
    collector.stop()
  }

  // Classement final visible par tout le monde
  const top = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)

  const medals = ['🥇', '🥈', '🥉']
  const classement = top.length
    ? top.map(([id, data], i) =>
        `${medals[i] || `${i + 1}.`} **${data.username}** — ${data.score} pts (${data.correct} bonnes / ${data.wrong} mauvaises)`
      ).join('\n')
    : 'Aucun participant cette semaine.'

  await announcementChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🏆 CLASSEMENT FINAL DU QUIZ')
      .setDescription(classement)
      .setColor('#FFD700')]
  })

  quizRunning = false
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('quiz')
      .setDescription('Lance le quiz trading de la semaine')
      .toJSON()
  ]

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  console.log('✅ Commande /quiz enregistrée')
}

client.on('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`)
  await registerCommands()

  setInterval(() => {
    const now = new Date()
    if (now.getDay() === 5 && now.getHours() === 16 && now.getMinutes() === 0) {
      client.channels.fetch(CHANNEL_ID).then(channel => startQuiz(channel))
    }
  }, 60000)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName === 'quiz') {
    await interaction.reply({ content: '🧠 Le quiz démarre !', ephemeral: true })
    const channel = await client.channels.fetch(CHANNEL_ID)
    startQuiz(channel)
  }
})

client.login(TOKEN)
