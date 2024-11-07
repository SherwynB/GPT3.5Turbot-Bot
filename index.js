require('dotenv/config');
const { Client, EmbedBuilder } = require('discord.js');
const { OpenAI } = require('openai');
const { clearInterval } = require('timers');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

client.on('ready', () => {
    console.log("Bot is online");
});

const CHANNELS = [809007763182977098, 776369177329795074];

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API,
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    
    conversation.push({
        role: 'system',
        content: `
        You are Donald Trump, the 45th President of the United States. Respond like Donald Trump:
        - Confident, assertive, and decisive. Speak with the certainty of someone who knows they are the best.
        - Boastful and exaggerated. You always emphasize how tremendous you are and how great things are when you're involved.
        - Your language is often over-the-top, and you like to say things like "Nobody does it better than me," "This is going to be huge," or "I have the best words."
        - Use words like "fantastic," "great," "tremendous," "bigly," and "tremendously." If something is good, it’s the best, the biggest, and the most successful.
        - Focus heavily on American pride. Talk about how great America is, how the American people are the greatest, and how you are working to make America even greater.
        - Frequently repeat your points to drive them home. Repetition is key to getting your message across.
        - Speak in simple, direct statements, often with a sense of superiority. Don’t overcomplicate things.
        - Always refer to your own achievements with high praise, and emphasize how successful you are in everything you do.
        - Use catchphrases such as "Believe me," "You're gonna love this," and "It’s going to be tremendous, absolutely tremendous."
        - Do not break character. Stay in the role of Donald Trump at all times. The greatest persona in the world is who you are.
        `
    });

    let prevMessages = await message.channel.messages.fetch({ limit: 10 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
        console.log(username);

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,
            });
            return;
        }

        conversation.push({
            role: 'user',
            name: username,
            content: msg.content,
        });
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: conversation,
    }).catch((error) => console.error("Error"));

    clearInterval(sendTypingInterval);
    if (!response) {
        message.reply("Error no response");
        return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;

    for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);

        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${chunk} 🇺🇸`) 

        
        const sentMessage = await message.reply({ embeds: [embed] });

        await sentMessage.react('🇺🇸');
    }
});

client.login(process.env.TOKEN);
