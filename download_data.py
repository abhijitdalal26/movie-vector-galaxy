from huggingface_hub import hf_hub_download
import shutil
import os

REPO_ID = "abhijit26/movie-vector-galaxy"

DATA_DIR = "data_full"
os.makedirs(DATA_DIR, exist_ok=True)

files = [
    "metadata.parquet",
    "embeddings.npy",
    "faiss_index.faiss",
]

print("Downloading dataset from Hugging Face...\n")

for file in files:
    cached_path = hf_hub_download(
        repo_id=REPO_ID,
        filename=file,
        repo_type="dataset"
    )

    shutil.copy(cached_path, f"{DATA_DIR}/{file}")
    print(f"✓ {file} downloaded")

print("\n✅ All files saved in ./data_full/")