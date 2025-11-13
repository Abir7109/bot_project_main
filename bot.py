import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')
    print(f'Bot is in {len(bot.guilds)} guilds')

@bot.event
async def on_member_join(member):
    """Welcome new members"""
    channel = member.guild.system_channel
    if channel:
        await channel.send(f'Welcome {member.mention} to the server! 👋')

@bot.command(name='hello')
async def hello(ctx):
    """Say hello to the bot"""
    await ctx.send(f'Hello {ctx.author.mention}! 👋')

@bot.command(name='ping')
async def ping(ctx):
    """Check bot latency"""
    latency = round(bot.latency * 1000)
    await ctx.send(f'Pong! 🏓 Latency: {latency}ms')

@bot.command(name='info')
async def info(ctx):
    """Get bot information"""
    embed = discord.Embed(
        title='Bot Information',
        description='A simple personal bot',
        color=discord.Color.blue()
    )
    embed.add_field(name='Servers', value=len(bot.guilds), inline=True)
    embed.add_field(name='Users', value=len(bot.users), inline=True)
    embed.add_field(name='Prefix', value='!', inline=True)
    await ctx.send(embed=embed)

if __name__ == '__main__':
    TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    if not TOKEN:
        print('Error: DISCORD_BOT_TOKEN not found in .env file')
    else:
        bot.run(TOKEN)
