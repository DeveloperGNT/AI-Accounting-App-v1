import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  JournalEntry,
  CreateJournalEntryDto,
  PostJournalEntryResponse,
  ReverseJournalEntryResponse,
} from './journalEntriesTypes';

// Backend controller: @Controller('api/v1/journal-entries') ON TOP of the
// app-wide setGlobalPrefix('api/v1') → the real served route is
// /api/v1/api/v1/journal-entries (see swagger.json). The apiClient baseURL is
// '/api/v1', so paths include the extra 'api/v1' segment — this matches the
// served URL, NOT a duplication bug.
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
