const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js')
const questions = require('./questions')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.QUIZ_CHANNEL_ID
const CLIENT_ID = process.env.CLIENT_ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages]
})

let scores = {}
let quizRunning = false

async function sendQuizToDM(member, channel) {
  let dmChannel
  try {
    dmChannel = await member.createDM()
  } catch (e) {
    return
  }

  let memberScore = { username: member.user.username, score: 0, correct: 0, wrong: 0 }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dm_q${i}_A`).setLabel('A').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dm_q${i}_B`).setLabel('B').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dm_q${i}_C`).setLabel('C').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dm_q${i}_D`).setLabel('D').setStyle(ButtonStyle.Primary),
    )

    const msg = await dmChannel.send({
      embeds: [new EmbedBuilder()
        .setTitle(`❓ Question ${i + 1} / ${questions.length}`)
        .setDescription(q.question + '\n\n' + q.choices.join('\n'))
        .setColor('#0099ff')
        .setFooter({ text: '⏱️ 10 secondes !' })],
      components: [row]
    })

    const startTime = Date.now()
    let answered = false

    await new Promise(resolve => {
      const collector = msg.createMessageComponentCollector({ time: 10000 })

      collector.on('collect', async interaction => {
        if (answered) return
        answered = true

        const choice = interaction.customId.split('_')[2]
        const speed = Math.max(0, Math.round((10000 - (Date.now() - startTime)) / 1000))

        if (choice === q.answer) {
          const pts = 10 + speed
          memberScore.score += pts
          memberScore.correct += 1
          await interaction.reply({ content: `✅ Bonne réponse ! **+${pts} pts** (dont +${speed} pts rapidité)`, ephemeral: false })
        } else {
          memberScore.wrong += 1
          await interaction.reply({ content: `❌ Mauvaise réponse ! La bonne réponse était **${q.answer}** — ${q.choices.find(c => c.startsWith(q.answer))}`, ephemeral: false })
        }

        collector.stop()
      })

      collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => {})
        resolve()
      })
    })

    await new Promise(r => setTimeout(r, 2000))
  }

  scores[member.user.id] = memberScore

  await dmChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle('✅ Quiz terminé !')
      .setDescription(`Tu as obtenu **${memberScore.score} pts**\n✅ ${memberScore.correct} bonnes réponses\n❌ ${memberScore.wrong} mauvaises réponses`)
      .setColor('#00FF00')]
  })
}

async function startQuiz(announcementChannel) {
  if (quizRunning) {
    await announcementChannel.send('⚠️ Un quiz est déjà en cours !')
    return
  }

  quizRunning = true
  scores = {}

  await announcementChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🧠 QUIZ TRADING — ÇA COMMENCE !')
      .setDescription('Le quiz vient de démarrer ! **Vérifie tes messages privés** pour répondre aux questions 📩\n\nLes questions sont envoyées en privé — personne ne peut voir tes réponses ! 🔒')
      .setColor('#FFD700')]
  })

  const guild = announcementChannel.guild
  const members = await guild.members.fetch()
  const humanMembers = members.filter(m => !m.user.bot)

  const promises = humanMembers.map(member => sendQuizToDM(member, announcementChannel))
  await Promise.all(promises)

  await new Promise(r => setTimeout(r, 120000))

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
    await interaction.reply({ content: '🧠 Le quiz démarre ! Vérifie tes messages privés 📩', ephemeral: true })
    const channel = await client.channels.fetch(CHANNEL_ID)
    startQuiz(channel)
  }
})

client.login(TOKEN)
