require ('dotenv/config');

const { Client } = require('discord.js');
const { OpenAI } =  require('openai');
const { clearInterval } = require('timers');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
}
);

client.on('ready', () => {
    console.log("On");
})

const CHANNELS = [809007763182977098, 776369177329795074];

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API
});
console.log(openai.apiKey);

client.on('messageCreate', async (message) =>{
    if(message.author.bot)
        return;
           
    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    conversation.push({
        role: 'system',
        content: 'gpt4.0 test'
    });

    let prevMessages = await message.channel.messages.fetch({limit: 10});
    prevMessages.reverse();

    prevMessages.forEach((msg) =>{
        if(msg.author.bot && msg.author.id !== client.user.id)
            return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
        console.log(username);

        if(msg.author.id === client.user.id)
        {
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
    })

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        //model: 'gpt-3.5-turbo', switch to this when poor
        messages: conversation,
    })
    .catch((error) => console.error("Error"));

    clearInterval(sendTypingInterval);
    if(!response)
    {
        message.reply("Error no response");
        return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;

    for (let i=0; i< responseMessage.length; i+=chunkSizeLimit)
    {
        const chunk = responseMessage.substring(i, i+chunkSizeLimit);

        await message.reply(chunk);
    }

});

client.login(process.env.TOKEN);

