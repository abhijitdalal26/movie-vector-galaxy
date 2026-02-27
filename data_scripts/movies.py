import argparse
from pathlib import Path

import numpy as np
import pandas as pd


def build_natural_text(row: pd.Series) -> str:
    title = str(row.get("title", "")).strip()
    year_val = row.get("year", 0)
    year = f" ({int(year_val)})" if pd.notna(year_val) and int(year_val) != 0 else ""

    parts = [f"{title}{year}.".strip()]

    overview = str(row.get("overview", "")).strip()
    if overview:
        if not overview.endswith((".", "!", "?")):
            overview += "."
        parts.append(overview)

    genres = str(row.get("genres", "")).strip()
    if genres and genres.lower() not in {"unknown", "none", ""}:
        parts.append(f"Genres: {genres}.")

    return "search_document: " + " ".join(parts).strip()


def load_tmdb_csv() -> pd.DataFrame:
    import kagglehub

    dataset_dir = Path(kagglehub.dataset_download("alanvourch/tmdb-movies-daily-updates"))
    csv_path = dataset_dir / "TMDB_all_movies.csv"
    return pd.read_csv(csv_path)


def prepare_metadata(df: pd.DataFrame, min_votes: int, top_n: int) -> pd.DataFrame:
    df = df.copy()
    df["release_year"] = pd.to_datetime(df["release_date"], errors="coerce").dt.year
    filtered = df[df["vote_count"].fillna(0) >= min_votes].copy()
    filtered = filtered.sort_values("popularity", ascending=False).head(top_n).copy()

    filtered["genres"] = filtered["genres"].fillna("Unknown")
    filtered["cast"] = filtered.get("cast", "").fillna("") if "cast" in filtered.columns else ""
    filtered["director"] = filtered.get("director", "Unknown").fillna("Unknown") if "director" in filtered.columns else "Unknown"
    filtered["year"] = filtered["release_year"].fillna(0).astype(int)
    filtered = filtered[filtered["overview"].notna() & filtered["genres"].notna()].copy()

    filtered = filtered.reset_index(drop=True)
    filtered["vector_id"] = filtered.index.astype(int)
    filtered["text_for_embedding"] = filtered.apply(build_natural_text, axis=1)
    return filtered


def generate_embeddings(texts: list[str], model_name: str, batch_size: int) -> np.ndarray:
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(model_name, trust_remote_code=True)
    return model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype("float32")


def save_outputs(df: pd.DataFrame, embeddings: np.ndarray, out_dir: Path) -> None:
    import faiss

    out_dir.mkdir(parents=True, exist_ok=True)

    metadata_path = out_dir / "metadata.parquet"
    embeddings_path = out_dir / "embeddings.npy"
    faiss_path = out_dir / "faiss_index.faiss"

    df.to_parquet(metadata_path, index=False)
    np.save(embeddings_path, embeddings)

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    faiss.write_index(index, str(faiss_path))

    print(f"Saved metadata: {metadata_path}")
    print(f"Saved embeddings: {embeddings_path} ({embeddings.shape})")
    print(f"Saved FAISS index: {faiss_path} (ntotal={index.ntotal})")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build movie metadata + embeddings + FAISS index from TMDB daily updates.")
    parser.add_argument("--output-dir", default="data_dev", help="Directory to write metadata.parquet, embeddings.npy, faiss_index.faiss")
    parser.add_argument("--top-n", type=int, default=5000, help="Number of top-popularity movies to keep")
    parser.add_argument("--min-votes", type=int, default=30, help="Minimum vote_count filter")
    parser.add_argument("--model-name", default="nomic-ai/nomic-embed-text-v1.5", help="SentenceTransformer model name")
    parser.add_argument("--batch-size", type=int, default=128, help="Embedding batch size")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    movies_df = load_tmdb_csv()
    prepared_df = prepare_metadata(movies_df, min_votes=args.min_votes, top_n=args.top_n)
    embeddings = generate_embeddings(
        prepared_df["text_for_embedding"].tolist(),
        model_name=args.model_name,
        batch_size=args.batch_size,
    )

    if len(prepared_df) != embeddings.shape[0]:
        raise RuntimeError("Row count mismatch between metadata and embeddings.")

    save_outputs(prepared_df, embeddings, Path(args.output_dir))


if __name__ == "__main__":
    main()
