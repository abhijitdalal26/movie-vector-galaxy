import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
print(f"API Key Starts With: {TMDB_API_KEY[:5] if TMDB_API_KEY else 'NONE'}")

async def test_api():
    async with httpx.AsyncClient(timeout=15.0, http2=False, follow_redirects=True, headers={"User-Agent": "MovieVectorGalaxy/1.0"}) as client:
        # 98 is Gladiator, 4910 is Hannibal
        try:
            resp = await client.get(
                "https://api.themoviedb.org/3/movie/4910/videos",
                params={"api_key": TMDB_API_KEY, "language": "en-US"}
            )
            print(f"Status: {resp.status_code}")
            
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                print(f"Found {len(results)} videos:")
                for v in results:
                    print(f"  - {v['type']} on {v['site']} ({v['name']}): {v['key']}")
            else:
                print(f"Error Response: {resp.text}")
                
        except Exception as e:
            print(f"Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
