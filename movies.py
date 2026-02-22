import os
import pandas as pd
import numpy as np
import kagglehub
movies_path = kagglehub.dataset_download("alanvourch/tmdb-movies-daily-updates")
os.listdir(movies_path)
movies_df = pd.read_csv(f"{movies_path}/TMDB_all_movies.csv")
# download samble data to view in excel
# sample_movies = movies_df.sample(n=100, random_state=42)
# sample_movies.to_csv("movies_sample_100.csv", index=False)
print("Shape:", movies_df.shape)
print("\nColumns:", movies_df.columns.tolist())
print("\nFirst 3 rows:")
display(movies_df.head(3))
print("\nInfo:")
movies_df.info()
print("\nMissing values (%):")
print((movies_df.isnull().sum() / len(movies_df) * 100).round(2).sort_values(ascending=False))
print("\nBasic stats:")
display(movies_df.describe())
# title, overview, genres
import matplotlib.pyplot as plt
import seaborn as sns
import ast

# Set plot style
sns.set_style("whitegrid")

# Plot 1: Number of movies released each year
print("\n--- Movies Released Each Year ---")
movies_df['release_year'] = pd.to_datetime(movies_df['release_date'], errors='coerce').dt.year
year_counts = movies_df['release_year'].value_counts().sort_index()

plt.figure(figsize=(15, 7))
sns.lineplot(x=year_counts.index, y=year_counts.values)
plt.title('Number of Movies Released Each Year')
plt.xlabel('Year')
plt.ylabel('Number of Movies')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# Plot 2: Movies from each original language
# This plot tells most of the movies are in english so ignore this feature.
print("\n--- Movies by Original Language ---")
language_counts = movies_df['original_language'].value_counts().head(20) # Top 20 languages

plt.figure(figsize=(12, 7))
sns.barplot(x=language_counts.index, y=language_counts.values, hue=language_counts.index, palette='viridis', legend=False)
plt.title('Top 20 Original Languages of Movies')
plt.xlabel('Original Language')
plt.ylabel('Number of Movies')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
# Number of peoples voted
# for 66% of data the count is 0
zero_vote_count = movies_df[movies_df['vote_count'] == 0]
print(f"Number of movies with 0 vote count: {len(zero_vote_count)}")

total_movies = movies_df.shape[0]
percentage_zero_votes = (len(zero_vote_count) / total_movies) * 100
print(f"Percentage of movies with 0 vote count: {percentage_zero_votes:.2f}%")
movies_df.shape
df = movies_df[movies_df['vote_count'] >= 30].copy()
df = df.sort_values('popularity', ascending=False).head(5000).copy()
df.shape
print("Missing values for specified columns in df:")
print(df[['title', 'genres', 'overview']].isnull().sum())
df['genres'] = df['genres'].fillna('Unknown')
df['cast'] = df['cast'].fillna('')
df['director'] = df['director'].fillna('Unknown')

df['year'] = df['release_year'].fillna(0).astype(int)
df = df.drop(columns=['release_year'])

df = df[df['overview'].notna() & df['genres'].notna()].copy()

print("Shape after dropping rows with null 'overview' or 'genres':", df.shape)
print(df[['title', 'genres', 'overview']].isnull().sum())
def build_natural_text(row):
    parts = []

    title = str(row['title']).strip()
    year = f" ({int(row['year'])})" if 'year' in row and pd.notna(row['year']) and row['year'] != 0 else ""
    parts.append(f"{title}{year}.")

    overview = str(row.get('overview', '')).strip()
    if overview:
        if not overview.endswith(('.', '!', '?')):
            overview += "."
        parts.append(overview)

    genres = str(row.get('genres', '')).strip()
    if genres and genres.lower() not in ['unknown', 'none', '']:
        parts.append(f"Genres: {genres}.")

    text = " ".join(parts).strip()
    return f"search_document: {text}"

# Uncomment to use this version instead
df['text_for_embedding'] = df.apply(build_natural_text, axis=1)
for i in range(3):
    txt = df['text_for_embedding'].iloc[i]
    print(f"\nRow {i} ({df['title'].iloc[i]}):")
    print(txt[:600] + "..." if len(txt) > 600 else txt)

print("\nAverage text length:", df['text_for_embedding'].str.len().mean().round(0))
print("Any empty texts?", (df['text_for_embedding'].str.strip() == '').sum())
!pip install -q sentence-transformers
from sentence_transformers import SentenceTransformer
import numpy as np
import torch
from tqdm.auto import tqdm

model_name = 'nomic-ai/nomic-embed-text-v1.5'

print(f"Loading model: {model_name}")
model = SentenceTransformer(model_name, trust_remote_code=True)

# Use GPU if available (Colab → change runtime to GPU)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = model.to(device)
print(f"Using device: {device}")

# Your texts
texts = df['text_for_embedding'].tolist()

print(f"Encoding {len(texts)} texts...")
embeddings = model.encode(
    texts,
    batch_size=128,
    show_progress_bar=True,
    normalize_embeddings=True,      # very important for cosine similarity
    convert_to_numpy=True
)

print("\nEmbeddings created!")
print("Shape:", embeddings.shape)      # should be (5000, 768)

# Save immediately
np.save('embeddings_5k_nomic.npy', embeddings)
print("Embeddings saved → embeddings_5k_nomic.npy")
import numpy as np
import pandas as pd
import os

# Embeddings are already in the 'embeddings' variable from the previous cell

# Prepare metadata
# Ensure 'df' is the filtered DataFrame used for embeddings
# It should contain 'title', 'genres', 'cast_top5', 'director', 'year'
# Check if 'cast_top5' and 'director' exist, otherwise use placeholders
metadata_cols = ['title', 'genres', 'year']
if 'cast_top5' in df.columns:
    metadata_cols.append('cast_top5')
else:
    df['cast_top5'] = '' # Add empty column if not present
if 'director' in df.columns:
    metadata_cols.append('director')
else:
    df['director'] = 'Unknown' # Add 'Unknown' if not present

metadata_df = df[metadata_cols].copy()

# Create a single label for each movie by concatenating relevant metadata
# This will be displayed when hovering over points in Projector
def create_label(row):
    parts = [f"{row['title']} ({int(row['year'])})"]
    if row['genres'] and row['genres'] != 'Unknown':
        parts.append(f"Genres: {row['genres']}")
    if 'cast_top5' in row and row['cast_top5']:
        parts.append(f"Cast: {row['cast_top5']}")
    if 'director' in row and row['director'] != 'Unknown':
        parts.append(f"Director: {row['director']}")
    return ' - '.join(parts)

metadata_df['label'] = metadata_df.apply(create_label, axis=1)

# Save embeddings to TSV
embeddings_tsv_path = 'embeddings.tsv'
np.savetxt(embeddings_tsv_path, embeddings, delimiter='\t')
print(f"Embeddings saved to {embeddings_tsv_path}")

# Save metadata to TSV
metadata_tsv_path = 'metadata.tsv'
# TensorBoard Projector expects metadata file without header and tab-separated
metadata_df['label'].to_csv(metadata_tsv_path, sep='\t', index=False, header=False)
print(f"Metadata saved to {metadata_tsv_path}")

print("\nNow we can upload these two files to https://projector.tensorflow.org/")
!zip embeddings.zip embeddings.tsv metadata.tsv
from google.colab import files
files.download('embeddings.zip')
from sentence_transformers.util import cos_sim

# Change indices to test different pairs
i, j = 0, 15

sim = cos_sim(embeddings[i], embeddings[j])[0][0].item()
print(f"Similarity between {df['title'].iloc[i]} and {df['title'].iloc[j]}: {sim:.4f}")
!pip install faiss-cpu
import numpy as np
import faiss
import pandas as pd

# Load your data
# Use the embeddings array already in memory from the previous step (2DhlTt5Bk-4y)
# If you saved a specific 'embeddings_5k_nomic.npy', you could load it here:
embeddings = np.load('embeddings_5k_nomic.npy').astype('float32')

# Assuming 'df' is the cleaned and processed DataFrame already in memory.
# Remove the line that tries to load 'movies_5k_with_text.parquet' to avoid inconsistencies
# df = pd.read_parquet('movies_5k_with_text.parquet') # This line is removed

print("Embeddings shape:", embeddings.shape)
print("DataFrame shape:", df.shape)
# Build FAISS Index (very fast for similarity search)
dim = embeddings.shape[1]   # 768

index = faiss.IndexFlatIP(dim)        # Inner Product = Cosine when normalized
index.add(embeddings)

faiss.write_index(index, 'faiss_index_5k.faiss')

print("FAISS index built and saved!")
def find_similar_movies(query_title, top_k=10):
    # Find the row(s) in df where the title matches (case-insensitive)
    matching_rows_df = df[df['title'].str.contains(query_title, case=False, na=False)]

    if matching_rows_df.empty:
        print("Movie not found!")
        return

    # Get the *original index value* of the first matching movie
    movie_original_index_value = matching_rows_df.index[0]

    # Now, find the *positional integer index* (iloc) of this movie within the *current* df
    # This positional index will correctly map to the embeddings array
    movie_iloc = df.index.get_loc(movie_original_index_value)

    # Search using the correct positional embedding
    query_vector = embeddings[movie_iloc].reshape(1, -1)
    distances, indices = index.search(query_vector, top_k + 1)

    print(f"\n🎥 Movies similar to: **{df['title'].iloc[movie_iloc]}**\n")
    for rank, i in enumerate(indices[0][1:], 1):   # skip itself
        # 'i' here are the positional indices returned by FAISS, so we can use .iloc
        title = df['title'].iloc[i]
        print(f"{rank:2d}. {title} (Similarity: {distances[0][rank]:.4f})")

# Test it
find_similar_movies("Inception", top_k=8)
find_similar_movies("The Dark Knight", top_k=8)
# Reduce to 3D using UMAP (best for galaxy look)
import umap
import plotly.express as px

print("Reducing to 3D... (this may take 30–90 seconds)")

reducer = umap.UMAP(
    n_components=3,
    n_neighbors=30,
    min_dist=0.1,
    random_state=42
)

umap_3d = reducer.fit_transform(embeddings)

# Add coordinates to dataframe
df['umap_x'] = umap_3d[:, 0]
df['umap_y'] = umap_3d[:, 1]
df['umap_z'] = umap_3d[:, 2]

print("3D coordinates created!")
fig = px.scatter_3d(
    df,
    x='umap_x',
    y='umap_y',
    z='umap_z',
    hover_name='title',
    hover_data=['year', 'genres'],
    color='year',                    # color by year (beautiful gradient)
    # color='genres',                # or color by genre (if you want)
    title="🎥 Movie Galaxy - 3D Interactive (5,000 Movies)",
    opacity=0.8,
    width=1000,
    height=800
)

fig.update_traces(marker=dict(size=4))
fig.update_layout(scene=dict(
    xaxis_title='UMAP 1',
    yaxis_title='UMAP 2',
    zaxis_title='UMAP 3'
))

fig.show()
fig.write_html("movie_galaxy_3d.html")
print("Saved as movie_galaxy_3d.html — open in browser!")
!pip install -q -U datasets polars pyarrow faiss-cpu tqdm
import polars as pl
from datasets import load_dataset
import numpy as np
import faiss
import os, gc
from tqdm.auto import tqdm

# folders
cache_dir = "/kaggle/working/hf_cache"
output_dir = "/kaggle/working/production_files"

os.makedirs(cache_dir, exist_ok=True)
os.makedirs(output_dir, exist_ok=True)

print("Folders ready")
print("Downloading dataset to local Colab storage...")

ds = load_dataset(
    "Remsky/Embeddings__Ultimate_1Million_Movies_Dataset",
    split="train",
    cache_dir=cache_dir   # forces local storage
)

print("Download complete")
print("Total rows:", len(ds))
print("Total columns:", len(ds.column_names))
print("\nColumns:\n")

for col in ds.column_names:
    print(col)
import pprint
pprint.pprint(ds[2])
KEEP_COLUMNS = [
    "id",
    "title",
    "release_date",
    "original_language",
    "overview",
    "genres",
    "movie_cast",
    "director",
    "writers",
    "runtime",
    "vote_average",
    "vote_count",
    "imdb_rating",
    "imdb_votes",
    "popularity",
    "poster_path",
    "embedding"
]
 
ds_clean = ds.remove_columns(
    [col for col in ds.column_names if col not in KEEP_COLUMNS]
)

print("Remaining columns:")
print(ds_clean.column_names)
from collections import defaultdict
from tqdm.auto import tqdm

null_counts = defaultdict(int)
total_rows = len(ds_clean)

batch_size = 5000

print("Calculating null percentages...")

for start in tqdm(range(0, total_rows, batch_size)):
    batch = ds_clean[start:start + batch_size]
    
    for col in ds_clean.column_names:
        values = batch[col]
        null_counts[col] += sum(v is None for v in values)
print("\nNull Percentage per Column:\n")

null_percentages = {}

for col in ds_clean.column_names:
    pct = (null_counts[col] / total_rows) * 100
    null_percentages[col] = pct
    print(f"{col:25s} : {pct:.2f}%")
import polars as pl
import numpy as np
import faiss
import os, gc
from tqdm.auto import tqdm
chunk_size = 6000
def parse_embedding(s):
    try:
        return np.fromstring(s[1:-1], sep=",", dtype=np.float32)
    except:
        return None
print("Generating production files...")

partial_meta_paths = []
partial_emb_paths = []

vector_offset = 0
chunk_idx = 0

for start in tqdm(range(0, len(ds_clean), chunk_size)):

    batch = ds_clean[start:start + chunk_size]
    df = pl.from_dicts(batch)

    # ---------- Keep full date ----------
    df = df.with_columns(
        pl.col("release_date")
        .str.strptime(pl.Date, "%Y-%m-%d", strict=False)
        .alias("release_date")
    )

    # ---------- Add YEAR ----------
    df = df.with_columns(
        pl.col("release_date")
        .dt.year()
        .fill_null(0)
        .cast(pl.Int32)
        .alias("year")
    )

    # ---------- Add vector_id ----------
    df = df.with_row_index("vector_id", offset=vector_offset) # this is what caused the 
    vector_offset += len(df)

    # ---------- Convert embeddings ----------
    df = df.with_columns(
        pl.col("embedding")
        .map_elements(parse_embedding, return_dtype=pl.Object)
        .alias("embedding_array")
    ).filter(pl.col("embedding_array").is_not_null())

    # ---------- Save metadata ----------
    meta = df.drop(["embedding", "embedding_array"])

    meta_path = f"{output_dir}/metadata_part_{chunk_idx:04d}.parquet"
    meta.write_parquet(meta_path)
    partial_meta_paths.append(meta_path)

    # ---------- Save embeddings ----------
    emb = np.vstack(df["embedding_array"].to_list())

    emb_path = f"{output_dir}/embeddings_part_{chunk_idx:04d}.npy"
    np.save(emb_path, emb)
    partial_emb_paths.append(emb_path)

    print(f"Chunk {chunk_idx} saved ({len(df)} rows)")
    chunk_idx += 1

    del df, meta, emb
    gc.collect()

print("Chunks finished.")
metadata_final = pl.concat(
    (pl.read_parquet(p) for p in sorted(partial_meta_paths)),
    rechunk=True
)

metadata_final.write_parquet(f"{output_dir}/metadata.parquet")

print("Metadata shape:", metadata_final.shape)
emb_files = sorted([
    f"{output_dir}/{f}"
    for f in os.listdir(output_dir)
    if f.startswith("embeddings_part_")
])

sample = np.load(emb_files[0])
dim = sample.shape[1]

total_rows = sum(np.load(f).shape[0] for f in emb_files)

embeddings_path = f"{output_dir}/embeddings.npy"

embeddings_final = np.memmap(
    embeddings_path,
    dtype="float32",
    mode="w+",
    shape=(total_rows, dim)
)

cursor = 0
for f in tqdm(emb_files):
    chunk = np.load(f)
    n = chunk.shape[0]
    embeddings_final[cursor:cursor+n] = chunk
    cursor += n

embeddings_final.flush()

print("Embeddings ready:", embeddings_final.shape)
embeddings = np.memmap(
    f"{output_dir}/embeddings.npy",
    dtype="float32",
    mode="r",
    shape=(total_rows, dim)
)

index = faiss.IndexFlatIP(dim)
index.add(embeddings)

faiss.write_index(index, f"{output_dir}/faiss_index.faiss")

print("FAISS index saved ✓")
os.listdir(output_dir)
!rm -rf /kaggle/working/hf_cache
!rm -rf /root/.cache/huggingface
!rm -rf /root/.julia
!du -h --max-depth=1 / | sort -hr | head
!du -h --max-depth=1 /root | sort -hr
!du -sh /kaggle/working/production_files
import os

PRODUCTION_DIR = "/kaggle/working/production_files"

# files to keep
KEEP_FILES = {
    "metadata.parquet",
    "embeddings.npy",
    "faiss_index.faiss"
}

for fname in os.listdir(PRODUCTION_DIR):
    fpath = os.path.join(PRODUCTION_DIR, fname)

    if fname not in KEEP_FILES and os.path.isfile(fpath):
        os.remove(fpath)

print("✅ Cleanup complete")
print("Remaining files:")
print(os.listdir(PRODUCTION_DIR))
import os
import shutil

# ---------- PATHS ----------
OUTPUT_DIR = "/kaggle/working/production_files"
FINAL_DIR = "/kaggle/working/final_export"

os.makedirs(FINAL_DIR, exist_ok=True)

print("Copying metadata and FAISS index...")

# Copy metadata
shutil.copy(
    f"{OUTPUT_DIR}/metadata.parquet",
    f"{FINAL_DIR}/metadata.parquet"
)

# Copy FAISS index
shutil.copy(
    f"{OUTPUT_DIR}/faiss_index.faiss",
    f"{FINAL_DIR}/faiss_index.faiss"
)

print("✅ Metadata and FAISS index copied")

print("\nCurrent final_export contents:")
print(os.listdir(FINAL_DIR))
# !rm /kaggle/working/production_files/faiss_index.faiss
# !rm /kaggle/working/production_files/metadata.parquet
# !rm /kaggle/working/final_export/embeddings.npy
import numpy as np
import polars as pl
import os

PRODUCTION_DIR = "/kaggle/working/production_files"
FINAL_DIR = "/kaggle/working/final_export"

meta = pl.read_parquet(f"{FINAL_DIR}/metadata.parquet")

rows = meta.height
dim = 768

print("Opening memmap...")

src = np.memmap(
    f"{PRODUCTION_DIR}/embeddings.npy",
    dtype="float32",
    mode="r",
    shape=(rows, dim)
)

print("Creating destination array (streamed)...")

dst = np.lib.format.open_memmap(
    f"{FINAL_DIR}/embeddings.npy",
    mode="w+",
    dtype="float32",
    shape=(rows, dim)
)

# copy in chunks (VERY IMPORTANT)
chunk_size = 5000

for i in range(0, rows, chunk_size):
    dst[i:i+chunk_size] = src[i:i+chunk_size]

del dst
del src

print("✅ Conversion finished without storage spike")
# !rm /kaggle/working/production_files/embeddings.npy
# ---------- Verify ----------
emb = np.load(f"{FINAL_DIR}/embeddings.npy")

print("\nVerification:")
print("Shape:", emb.shape)
print("Dtype:", emb.dtype)

print("\nFinal folder contents:")
print(os.listdir(FINAL_DIR))
import polars as pl
import numpy as np
import faiss

DATA_PATH = "/kaggle/working/final_export"

print("Loading files...")

metadata = pl.read_parquet(f"{DATA_PATH}/metadata.parquet")

embeddings = np.load(f"{DATA_PATH}/embeddings.npy")

index = faiss.read_index(f"{DATA_PATH}/faiss_index.faiss")

print("Metadata rows:", metadata.height)
print("Embedding shape:", embeddings.shape)
print("FAISS vectors:", index.ntotal)
import polars as pl

DATA_PATH = "/kaggle/working/final_export"

# metadata = pl.read_parquet(f"{DATA_PATH}/metadata.parquet")

# add alignment index
metadata = metadata.with_row_index("vector_id")

# overwrite safely
metadata.write_parquet(f"{DATA_PATH}/metadata.parquet")

print("✅ vector_id added")
print(metadata.select(["vector_id", "title"]).head())
print(metadata.columns)
title_to_id = {
    t.lower(): vid
    for t, vid in zip(
        metadata["title"],
        metadata["vector_id"]
    )
    if t is not None
}

def recommend(movie_title, k=10):

    movie_title = movie_title.lower()

    if movie_title not in title_to_id:
        print("❌ Movie not found")
        return

    vector_id = title_to_id[movie_title]

    query_vec = embeddings[vector_id].reshape(1, -1)

    distances, indices = index.search(query_vec, k + 1)

    results = (
        metadata[indices[0]]
        .select(["title", "year", "genres"])
        .with_columns(
            pl.Series("similarity", distances[0])
        )
    )

    # remove itself
    return results[1:]
recommend("Batman")
# FESS vs Metadata alignment 
import faiss
import numpy as np
import polars as pl

meta = pl.read_parquet("/kaggle/working/final_export/metadata.parquet")
index = faiss.read_index("/kaggle/working/final_export/faiss_index.faiss")

print("Metadata rows:", meta.height)
print("FAISS vectors:", index.ntotal)
!pip install -q huggingface_hub
from huggingface_hub import login
login()
from huggingface_hub import create_repo

create_repo(
    repo_id="abhijit26/movie-vector-galaxy",
    repo_type="dataset",
    exist_ok=True
)
from huggingface_hub import upload_folder

upload_folder(
    folder_path="/kaggle/working/final_export",
    repo_id="abhijit26/movie-vector-galaxy",
    repo_type="dataset"
)
# I can create the ML based recommandation using some of those 17 features 

