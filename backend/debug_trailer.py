import pandas as pd
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
VECTOR_ID = 450543

async def debug():
    df = pd.read_parquet('d:/Projects/movie-vector-galaxy/data_dev/metadata.parquet')
    movie = df[df['vector_id'] == VECTOR_ID]
    if movie.empty:
        print(f"Vector ID {VECTOR_ID} not found in dataset.")
        return
        
    tmdb_id = movie['id'].values[0]
    title = movie['title'].values[0]
    print(f"Found '{title}' with TMDB ID: {tmdb_id}")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.themoviedb.org/3/movie/{int(tmdb_id)}/videos",
            params={"api_key": TMDB_API_KEY, "language": "en-US"}
        )
        print(f"API Status: {resp.status_code}")
        data = resp.json()
        results = data.get("results", [])
        
        print(f"Total Videos Found: {len(results)}")
        for i, v in enumerate(results):
            print(f"  {i+1}. Type: {v.get('type')}, Site: {v.get('site')}, Name: '{v.get('name')}', Key: {v.get('key')}")

if __name__ == "__main__":
    asyncio.run(debug())
