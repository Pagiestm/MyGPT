import api from './api.utils';

export default class Database {
    /**
     * -- General CRUD
     */
    static async getAll(collection: string, params?: object) {
        try {
            const response = await api.get(`/${collection}`, { params });
            return response.data;
        } catch (err: unknown) {
            console.error('API Error in Database.getAll:', err);
            throw err;
        }
    }

    static async getOne(collection: string, id: string, params?: object) {
        try {
            const response = await api.get(`/${collection}/${id}`, { params });
            return response.data;
        } catch (err: unknown) {
            console.error('API Error in Database.getOne:', err);
            throw err;
        }
    }

    static async create(collection: string, item: object) {
        try {
            const response = await api.post(`/${collection}`, item);
            return {
                data: response.data,
                status: response.status
            };
        } catch (err: unknown) {
            console.error('API Error in Database.create:', err);
            throw err;
        }
    }

    static async update(collection: string, id: string, item: object) {
        try {
            const response = await api.patch(`/${collection}/${id}`, item);
            return response.data;
        } catch (err: unknown) {
            console.error('API Error in Database.update:', err);
            throw err;
        }
    }

    static async patch(collection: string, item?: object, params?: object) {
        try {
            const response = await api.patch(`/${collection}`, item, {
                params
            });
            return response.data;
        } catch (err: unknown) {
            console.error('API Error in Database.patch:', err);
            throw err;
        }
    }

    static async delete(collection: string) {
        try {
            const { status } = await api.delete(`/${collection}`);
            return status;
        } catch (err: unknown) {
            console.error('API Error in Database.delete:', err);
            throw err;
        }
    }
}
