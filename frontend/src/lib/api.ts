import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Movie {
    vector_id: number;
    id: number;
    title: string;
    overview: string | null;
    poster_path: string | null;
    release_date: string | null;
    vote_average: number | null;
    popularity: number | null;
    genres: string | null;
    similarity_distance?: number;
}

/**
 * A single star in the 3D galaxy.
 * x, y, z are UMAP coordinates (range ~[-1, 1] from parquet; the frontend scales them).
 */
export interface GalaxyStar {
    vector_id: number;
    x: number;
    y: number;
    z: number;
    title: string;
    vote_average: number | null;
    genres: string | null;
}

export const api = {
    getTrending: async (limit: number = 20): Promise<Movie[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/movies/trending?limit=${limit}`);
            return response.data.results || [];
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            return [];
        }
    },

    searchSemantic: async (query: string, limit: number = 10): Promise<Movie[]> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/search/semantic`, {
                query,
                limit
            });
            return response.data.results || [];
        } catch (error) {
            console.error('Error performing semantic search:', error);
            return [];
        }
    },

    getMovie: async (vectorId: number): Promise<Movie | null> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/movies/${vectorId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching movie ${vectorId}:`, error);
            return null;
        }
    },

    /**
     * Fetch galaxy star positions for the 3D renderer.
     * @param limit  Device-appropriate star count (3000/8000/20000).
     * @param regionX Optional spatial filter X
     * @param regionY Optional spatial filter Y
     * @param regionZ Optional spatial filter Z
     * @param radius  Optional spatial filter radius
     */
    getGalaxyData: async (
        limit: number = 20000,
        regionX?: number,
        regionY?: number,
        regionZ?: number,
        radius?: number
    ): Promise<GalaxyStar[]> => {
        try {
            const params: Record<string, number> = { limit };
            if (regionX !== undefined && regionY !== undefined && regionZ !== undefined && radius !== undefined) {
                params.region_x = regionX;
                params.region_y = regionY;
                params.region_z = regionZ;
                params.radius = radius;
            }
            const response = await axios.get(`${API_BASE_URL}/galaxy`, { params });
            return response.data.stars || [];
        } catch (error) {
            console.error('Error fetching galaxy data:', error);
            return [];
        }
    },

    getPosterUrl: (path: string | null, size: string = 'w500') => {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Poster';
        return `https://image.tmdb.org/t/p/${size}${path}`;
    }
};
