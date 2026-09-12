export interface JournalLine {
  id: string;
  organizationId: string;
  journalEntryId: string;
  accountId: string;
  description?: string | null;
  debitAmount: number;
  creditAmount: number;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  organizationId: string;
  entryNumber: string;
  entryDate: string; // ISO date string
  description: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  reversalOfId?: string | null;
  postedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lines: JournalLine[];
}

export interface CreateJournalLineDto {
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
}

export interface CreateJournalEntryDto {
  entryDate: string; // ISO date string
  description: string;
  lines: CreateJournalLineDto[];
}

export type UpdateJournalEntryDto = Partial<CreateJournalEntryDto>;

export interface JournalEntryListResponse {
  data: JournalEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface PostJournalEntryResponse {
  success: boolean;
  data: JournalEntry;
}

export interface ReverseJournalEntryResponse {
  success: boolean;
  data: JournalEntry;
}
