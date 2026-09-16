import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  JournalEntry,
  CreateJournalEntryDto,
  PostJournalEntryResponse,
  ReverseJournalEntryResponse,
} from './journalEntriesTypes';

// Route note: the backend AccountingController declares @Controller('api/v1/
// journal-entries') while main.ts also applies setGlobalPrefix('api/v1'), so
// the actually served route is /api/v1/api/v1/journal-entries (the Swagger
// docs show the doubled path too). The apiClient baseURL is '/api/v1', so the
// service path must repeat 'api/v1' to match the browser-verified URL.
export const journalEntriesApi = {
  // POST /api/v1/api/v1/journal-entries — create draft entry
  async create(payload: CreateJournalEntryDto): Promise<JournalEntry> {
    const response = await apiClient.post('/api/v1/journal-entries', payload);
    return unwrapApiResponse<JournalEntry>(response.data);
  },
  // GET /api/v1/api/v1/journal-entries — the backend returns a BARE ARRAY
  // (accounting.controller.ts: return { success: true, data } where data =
  // JournalEntry[] from accountingService.findAll), not a paginated shape.
  async list(): Promise<JournalEntry[]> {
    const response = await apiClient.get('/api/v1/journal-entries');
    return unwrapApiResponse<JournalEntry[]>(response.data);
  },
  // GET /api/v1/api/v1/journal-entries/:id
  async get(id: string): Promise<JournalEntry> {
    const response = await apiClient.get(`/api/v1/journal-entries/${id}`);
    return unwrapApiResponse<JournalEntry>(response.data);
  },
  // POST /api/v1/api/v1/journal-entries/:id/post
  async post(id: string): Promise<PostJournalEntryResponse> {
    const response = await apiClient.post(`/api/v1/journal-entries/${id}/post`);
    return unwrapApiResponse<PostJournalEntryResponse>(response.data);
  },
  // POST /api/v1/api/v1/journal-entries/:id/reverse
  async reverse(id: string): Promise<ReverseJournalEntryResponse> {
    const response = await apiClient.post(`/api/v1/journal-entries/${id}/reverse`);
    return unwrapApiResponse<ReverseJournalEntryResponse>(response.data);
  },
};
