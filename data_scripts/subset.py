!pip install faiss-cpu pandas pyarrow huggingface_hub
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="abhijit26/movie-vector-galaxy",
    repo_type="dataset",
    local_dir="data_full",
    local_dir_use_symlinks=False
)
import os
import pandas as pd
import numpy as np
import faiss
DATA_DIR = "data_full"

os.listdir(DATA_DIR)
meta = pd.read_parquet(f"{DATA_DIR}/metadata.parquet")
print(f"meta shape {meta.shape}")
meta.columns.tolist()
meta.head(3)
meta.info(memory_usage="deep")
meta.isnull().sum().sort_values(ascending=False).head(18)
meta.describe(include="all")
emb = np.load(f"{DATA_DIR}/embeddings.npy")
emb.shape
emb.dtype
emb.nbytes / (1024**3)
emb[0][:10]
np.linalg.norm(emb[0])
index = faiss.read_index(f"{DATA_DIR}/faiss_index.faiss")
type(index)
index.ntotal
index.d
movie_idx = 100

D, I = index.search(emb[movie_idx].reshape(1, -1), 5)

meta.iloc[I[0]][["title"]]
DATA_FULL = "data_full"
DATA_DEV = "data_dev"

os.makedirs(DATA_DEV, exist_ok=True)

meta = pd.read_parquet(f"{DATA_FULL}/metadata.parquet")
emb = np.load(f"{DATA_FULL}/embeddings.npy").astype("float32")
meta["imdb_votes"] = meta["imdb_votes"].fillna(0)
meta["imdb_votes"].describe()
DEV_SIZE = 20000

top_meta = (
    meta.sort_values("imdb_votes", ascending=False)
        .head(DEV_SIZE)
)
# to keep embedding align
indices = top_meta.index.to_numpy()
indices.sort()
meta_dev = meta.iloc[indices].reset_index(drop=True)

meta_dev.to_parquet(f"{DATA_DEV}/metadata.parquet")

meta_dev.shape
emb_dev = emb[indices]

np.save(f"{DATA_DEV}/embeddings.npy", emb_dev)

emb_dev.shape
dim = emb_dev.shape[1]

index_dev = faiss.IndexFlatIP(dim)
index_dev.add(emb_dev)

faiss.write_index(index_dev, f"{DATA_DEV}/faiss_index.faiss")
print(len(meta_dev))
print(emb_dev.shape[0])
print(index_dev.ntotal)
movie_idx = 100

D, I = index_dev.search(
    emb_dev[movie_idx].reshape(1, -1),
    5
)

meta_dev.iloc[I[0]][["title", "imdb_votes"]]
import shutil
import os

output_filename = "data_dev"
zip_directory = "data_dev"

if os.path.exists(zip_directory):
    shutil.make_archive(output_filename, 'zip', zip_directory)
    print(f"Successfully created {output_filename}.zip")
else:
    print(f"Directory '{zip_directory}' not found. Please ensure it exists before zipping.")
import shutil; import os; output_filename = "data_dev"; zip_directory = "data_dev"; shutil.make_archive(output_filename, 'zip', zip_directory) if os.path.exists(zip_directory) else print(f"Directory '{zip_directory}' not found. Please ensure it exists before zipping.")
DATA_DEV = "data_dev"

meta = pd.read_parquet(f"{DATA_DEV}/metadata.parquet")
emb = np.load(f"{DATA_DEV}/embeddings.npy")
index = faiss.read_index(f"{DATA_DEV}/faiss_index.faiss")

print("Loaded:", len(meta))
title_to_idx = {
    title.lower(): idx
    for idx, title in enumerate(meta["title"])
}

def recommend_similar(movie_title, k=5):

    movie_title = movie_title.lower()

    if movie_title not in title_to_idx:
        print("Movie not found!")
        return

    idx = title_to_idx[movie_title]

    query_vec = emb[idx].reshape(1, -1)

    # +1 because first result is the movie itself
    D, I = index.search(query_vec, k + 1)

    results = meta.iloc[I[0][1:]][[
        "title",
        "year",
        "imdb_votes"
    ]]

    return results.reset_index(drop=True)

recommend_similar("tenet")
import numpy as np
import pandas as pd
import umap
DATA_DEV = "data_dev"

emb = np.load(f"{DATA_DEV}/embeddings.npy")

print(emb.shape)
from sklearn.preprocessing import normalize

emb_norm = normalize(emb, norm="l2")
reducer = umap.UMAP(
    n_components=3,      # 3D galaxy
    n_neighbors=30,      # cluster structure
    min_dist=0.05,       # tighter clusters
    metric="cosine",     # matches embeddings
    random_state=42,
    verbose=True
)
coords = reducer.fit_transform(emb_norm)
coords.shape
galaxy_df = pd.DataFrame({
    "vector_id": meta["vector_id"],
    "x": coords[:, 0],
    "y": coords[:, 1],
    "z": coords[:, 2],
})
for col in ["x", "y", "z"]:
    galaxy_df[col] = (
        galaxy_df[col] - galaxy_df[col].mean()
    ) / galaxy_df[col].std()
galaxy_df.to_parquet(
    f"{DATA_DEV}/galaxy_coords.parquet",
    index=False
)

print("Galaxy coordinates saved ✅")
import matplotlib.pyplot as plt

plt.figure(figsize=(6,6))
plt.scatter(
    galaxy_df["x"],
    galaxy_df["y"],
    s=1,
    alpha=0.4
)
plt.title("Galaxy Preview")
plt.show()


