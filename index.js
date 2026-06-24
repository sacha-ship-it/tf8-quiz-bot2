const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js')
const questions = require('./questions')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.QUIZ_CHANNEL_ID
const CLIENT_ID = process.env.CLIENT_ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

let scores = {}

async function startQuiz(channel) {
  scores = {}

  await channel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🧠 QUIZ TRADING — DANS 30 SECONDES !')
      .setDescription('Préparez-vous ! Vous avez **10 secondes** par question.\nRapidité + précision = plus de points ! 🚀')
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
        .setFooter({ text: '⏱️ 10 secondes !' })],
      components: [row]
    })

    const startTime = Date.now()
    const collector = msg.createMessageComponentCollector({ time: 10000 })

    collector.on('collect', async interaction => {
      if (answered.has(interaction.user.id)) {
        return interaction.reply({ content: '❌ Tu as déjà répondu !', ephemeral: true })
      }
      answered.add(interaction.user.id)

      const choice = interaction.customId.split('_')[1]
      const speed = Math.max(0, Math.round((10000 - (Date.now() - startTime)) / 1000))

      if (!scores[interaction.user.id]) {
        scores[interaction.user.id] = { username: interaction.user.username, score: 0 }
      }

      if (choice === q.answer) {
        const pts = 10 + speed
        scores[interaction.user.id].score += pts
        await interaction.reply({ content: `✅ Bonne réponse ! +${pts} pts (dont +${speed} rapidité)`, ephemeral: true })
      } else {
        await interaction.reply({ content: `❌ Mauvaise réponse ! Bonne réponse : **${q.answer}**`, ephemeral: true })
      }
    })

    await new Promise(r => setTimeout(r, 11000))
    await msg.edit({ components: [] })
    await channel.send(`✅ **Réponse : ${q.answer}** — ${q.choices.find(c => c.startsWith(q.answer))}`)
    await new Promise(r => setTimeout(r, 3000))
  }

  const top = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)

  const medals = ['🥇', '🥈', '🥉']
  const classement = top.length
    ? top.map(([id, data], i) => `${medals[i] || `${i + 1}.`} **${data.username}** — ${data.score} pts`).join('\n')
    : 'Aucun participant cette semaine.'

  await channel.send({
    embeds: [new EmbedBuilder()
      .setTitle('🏆 CLASSEMENT DU QUIZ')
      .setDescription(classement)
      .setColor('#FFD700')
      .setFooter({ text: 'Le gagnant remporte un compte de trading ! 🎁' })]
  })
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
