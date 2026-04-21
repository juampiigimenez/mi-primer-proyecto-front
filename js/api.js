/**
 * API client module
 */
import { CONFIG } from './config.js';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Transaction endpoints
  async getTransactions() {
    return this.request('/transacciones');
  }

  async createTransaction(data) {
    return this.request('/transacciones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getBalance() {
    return this.request('/balance');
  }

  // Import endpoints
  async uploadImportFile(file, sourceType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    return fetch(`${this.baseURL}/api/v1/imports/upload`, {
      method: 'POST',
      body: formData
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
      }
      return response.json();
    });
  }

  async getBatchTransactions(batchId) {
    return this.request(`/api/v1/imports/batches/${batchId}/transactions`);
  }

  async getImportHistory() {
    return this.request('/api/v1/imports/history');
  }

  async confirmBatch(batchId) {
    return this.request(`/api/v1/imports/batches/${batchId}/confirm`, {
      method: 'POST'
    });
  }

  // Transaction update/delete endpoints
  async updateTransaction(id, data) {
    return this.request(`/transacciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTransaction(id) {
    return this.request(`/transacciones/${id}`, {
      method: 'DELETE'
    });
  }

  // Week validation endpoints
  async validateWeek(year, week) {
    return this.request(`/api/v1/weeks/${year}/${week}/validate`, {
      method: 'POST'
    });
  }

  async getValidatedWeeks() {
    return this.request('/api/v1/weeks/validated');
  }

  async resetAllData() {
    return this.request('/api/v1/reset-all', {
      method: 'DELETE'
    });
  }
}

export const api = new APIClient(CONFIG.API_URL);
