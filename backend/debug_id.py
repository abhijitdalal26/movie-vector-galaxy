import pyarrow.parquet as pq

table = pq.read_table("d:/Projects/movie-vector-galaxy/data_dev/metadata.parquet")
df = table.to_pandas()
hannibal = df[df['vector_id'] == 4910]
if not hannibal.empty:
    print(f"vector_id 4910 maps to TMDB ID: {hannibal['id'].iloc[0]} (Type: {type(hannibal['id'].iloc[0])})")
else:
    print("Vector ID 4910 not found in dataset!")
