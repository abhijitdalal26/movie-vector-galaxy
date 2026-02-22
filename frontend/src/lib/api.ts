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

    getPosterUrl: (path: string | null, size: string = 'w500') => {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Poster';
        return `https://image.tmdb.org/t/p/${size}${path}`;
    }
};
