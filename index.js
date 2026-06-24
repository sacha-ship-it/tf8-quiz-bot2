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

async function startQuiz(channel) {
  if (quizRunning) {
    await channel.send('⚠️ Un quiz est déjà en cours !')
    return
  }

  quizRunning = true
  scores = {}

  await channel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🧠 QUIZ TRADING — DANS 30 SECONDES !')
      .setDescription('Préparez-vous ! Vous avez **10 secondes** par question.\n\n⚠️ Vos réponses sont **privées** — personne ne peut voir ce que vous répondez !\n\nRapidité + précision = plus de points ! 🚀')
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

    const msg = await channel.send({
      embeds: [new EmbedBuilder()
        .setTitle(`❓ Question ${i + 1} / ${questions.length}`)
        .setDescription(q.question + '\n\n' + q.choices.join('\n'))
        .setColor('#0099ff')
        .setFooter({ text: '⏱️ 10 secondes — vos réponses sont privées !' })],
      components: [row]
    })

    const startTime = Date.now()
    const collector = msg.createMessageComponentCollector({ time: 10000 })

    collector.on('collect', async interaction => {
      // Réponse éphémère = visible uniquement par la personne qui répond
      if (answered.has(interaction.user.id)) {
        return interaction.reply({
          content: '❌ Tu as déjà répondu à cette question !',
          ephemeral: true // Visible uniquement par toi
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
          ephemeral: true // Visible uniquement par toi
        })
      } else {
        scores[interaction.user.id].wrong += 1
        await interaction.reply({
          content: `❌ Mauvaise réponse ! La bonne réponse était **${q.answer}**`,
          ephemeral: true // Visible uniquement par toi
        })
      }
    })

    await new Promise(r => setTimeout(r, 11000))
    await msg.edit({ components: [] })

    // La correction est visible par tout le monde après le timer
    await channel.send(`✅ **Réponse : ${q.answer}** — ${q.choices.find(c => c.startsWith(q.answer))}`)
    await new Promise(r => setTimeout(r, 3000))
  }

  // Classement final
  const top = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)

  const medals = ['🥇', '🥈', '🥉']

  if (top.length === 0) {
    await channel.send('😢 Personne n\'a participé cette semaine !')
  } else {
    const classement = top.map(([id, data], i) =>
      `${medals[i] || `${i + 1}.`} **${data.username}** — ${data.score} pts (${data.correct} bonnes / ${data.wrong} mauvaises)`
    ).join('\n')

    await channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('🏆 CLASSEMENT FINAL DU QUIZ')
        .setDescription(classement)
        .setColor('#FFD700')
        .setFooter({ text: 'Le gagnant remporte un compte de trading ! 🎁' })]
    })
  }

  quizRunning = false
}

// Enregistrer la commande slash
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

  // Lancer automatiquement le vendredi à 16h
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
    await interaction.reply({ content: '🧠 Le quiz démarre dans le canal dédié !', ephemeral: true })
    const channel = await client.channels.fetch(CHANNEL_ID)
    startQuiz(channel)
  }
})

client.login(TOKEN)
