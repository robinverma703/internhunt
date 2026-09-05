import asyncio
from telethon.sync import TelegramClient

API_ID = 37430222
API_HASH = '40a3db2c8d64a62b42cf33886d8781c'
CHANNEL = '@jobs_and_internships_updates'

async def main():
    async with TelegramClient('job_session', API_ID, API_HASH) as client:
        print("Telegram se jobs fetch ho rahi hain...")
        async for message in client.iter_messages(CHANNEL, limit=5):
            if message.text:
                print("---")
                print(message.text)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(main())