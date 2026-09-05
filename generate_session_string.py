import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID = 37430222
API_HASH = '40a3db2c8d64a62b4b2cf33886d8781c'

async def main():
    async with TelegramClient(StringSession(), API_ID, API_HASH) as client:
        print("\nYour session string (copy everything below this line):\n")
        print(client.session.save())

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(main())