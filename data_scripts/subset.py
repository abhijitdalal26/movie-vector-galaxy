import argparse
from pathlib import Path

import numpy as np
import pandas as pd


def create_dev_subset(data_full_dir: Path, data_dev_dir: Path, dev_size: int) -> tuple[pd.DataFrame, np.ndarray]:
    import faiss

    metadata_path = data_full_dir / "metadata.parquet"
    embeddings_path = data_full_dir / "embeddings.npy"

    meta = pd.read_parquet(metadata_path)
    emb = np.load(embeddings_path).astype("float32")

    if len(meta) != emb.shape[0]:
        raise RuntimeError(f"Input mismatch: metadata rows={len(meta)} embeddings rows={emb.shape[0]}")

    if "imdb_votes" not in meta.columns:
        raise RuntimeError("metadata.parquet must contain imdb_votes to rank subset.")

    ranked = meta.copy()
    ranked["imdb_votes"] = ranked["imdb_votes"].fillna(0)
    top_meta = ranked.sort_values("imdb_votes", ascending=False).head(dev_size)

    selected_positions = np.sort(top_meta.index.to_numpy())
    meta_dev = meta.iloc[selected_positions].reset_index(drop=True).copy()
    emb_dev = emb[selected_positions]

    # Keep IDs aligned with FAISS positions.
    meta_dev["vector_id"] = np.arange(len(meta_dev), dtype=np.int64)

    data_dev_dir.mkdir(parents=True, exist_ok=True)
    meta_dev.to_parquet(data_dev_dir / "metadata.parquet", index=False)
    np.save(data_dev_dir / "embeddings.npy", emb_dev)

    index = faiss.IndexFlatIP(emb_dev.shape[1])
    index.add(emb_dev)
    faiss.write_index(index, str(data_dev_dir / "faiss_index.faiss"))

    print(f"Saved metadata: {data_dev_dir / 'metadata.parquet'} rows={len(meta_dev)}")
    print(f"Saved embeddings: {data_dev_dir / 'embeddings.npy'} shape={emb_dev.shape}")
    print(f"Saved FAISS index: {data_dev_dir / 'faiss_index.faiss'} ntotal={index.ntotal}")

    return meta_dev, emb_dev


def create_galaxy_coords(data_dev_dir: Path, n_neighbors: int, min_dist: float, random_state: int) -> None:
    try:
        import umap
        from sklearn.preprocessing import normalize
    except ImportError as exc:
        raise RuntimeError(
            "UMAP coordinate generation requires `umap-learn` and `scikit-learn`. "
            "Install them or run with --skip-umap."
        ) from exc

    meta = pd.read_parquet(data_dev_dir / "metadata.parquet")
    emb = np.load(data_dev_dir / "embeddings.npy")

    emb_norm = normalize(emb, norm="l2")
    reducer = umap.UMAP(
        n_components=3,
        n_neighbors=n_neighbors,
        min_dist=min_dist,
        metric="cosine",
        random_state=random_state,
        verbose=True,
    )
    coords = reducer.fit_transform(emb_norm)

    galaxy_df = pd.DataFrame(
        {
            "vector_id": meta["vector_id"].astype(int),
            "x": coords[:, 0],
            "y": coords[:, 1],
            "z": coords[:, 2],
        }
    )

    for col in ["x", "y", "z"]:
        galaxy_df[col] = (galaxy_df[col] - galaxy_df[col].mean()) / galaxy_df[col].std()

    out_path = data_dev_dir / "galaxy_coords.parquet"
    galaxy_df.to_parquet(out_path, index=False)
    print(f"Saved galaxy coordinates: {out_path} rows={len(galaxy_df)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a development subset from data_full files.")
    parser.add_argument("--data-full", default="data_full", help="Directory containing metadata.parquet and embeddings.npy")
    parser.add_argument("--data-dev", default="data_dev", help="Output directory for dev files")
    parser.add_argument("--dev-size", type=int, default=20000, help="Number of rows in the development subset")
    parser.add_argument("--skip-umap", action="store_true", help="Skip generating galaxy_coords.parquet")
    parser.add_argument("--n-neighbors", type=int, default=30, help="UMAP n_neighbors")
    parser.add_argument("--min-dist", type=float, default=0.05, help="UMAP min_dist")
    parser.add_argument("--random-state", type=int, default=42, help="UMAP random_state")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data_full_dir = Path(args.data_full)
    data_dev_dir = Path(args.data_dev)

    create_dev_subset(data_full_dir, data_dev_dir, dev_size=args.dev_size)

    if not args.skip_umap:
        create_galaxy_coords(
            data_dev_dir,
            n_neighbors=args.n_neighbors,
            min_dist=args.min_dist,
            random_state=args.random_state,
        )


if __name__ == "__main__":
    main()
