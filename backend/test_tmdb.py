import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
tmdb_id = 603 # The Matrix

async def test():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos",
                params={"api_key": TMDB_API_KEY, "language": "en-US"}
            )
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
        except Exception as e:
            print(f"EXCEPTION: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
