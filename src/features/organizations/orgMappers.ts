import type { CreateOrganizationRequest, OrganizationResponse } from '../../api/types';
import type { BusinessType, Organization } from '../../types';

const KNOWN_BUSINESS_TYPES: BusinessType[] = [
  'Private Limited',
  'Proprietorship',
  'Partnership',
  'LLP',
  'Public Limited',
  'Individual',
  'Trust',
  'Society',
  'Other',
];

const DEFAULT_FINANCIAL_YEAR = '2026–27';

export const slugifyOrganizationName = (name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `org-${Date.now()}`;
};

export const toBusinessType = (businessType?: string | null): BusinessType => {
  const match = KNOWN_BUSINESS_TYPES.find(
    (type) => type.toLowerCase() === (businessType || '').toLowerCase(),
  );
  return match || 'Other';
};

export const toUiOrganization = (org: OrganizationResponse): Organization => ({
  id: org.id,
  name: org.name,
  businessType: toBusinessType(org.business_type),
  gstin: org.gstin || '',
  pan: '',
  financialYear: DEFAULT_FINANCIAL_YEAR,
  address: '',
  city: '',
  state: '',
  pincode: '',
  email: org.email || '',
  phone: org.phone || '',
  createdAt: org.created_at,
  userRole: 'Owner',
});

export interface CreateOrganizationFormValues {
  name: string;
  tradeName?: string;
  businessType?: string;
  gstin?: string;
  email?: string;
  phone?: string;
}

export const toCreateOrganizationRequest = (
  form: CreateOrganizationFormValues,
): CreateOrganizationRequest => ({
  name: form.name.trim(),
  slug: slugifyOrganizationName(form.name),
  business_type: form.businessType || undefined,
  gstin: form.gstin?.trim() || undefined,
  email: form.email?.trim() || undefined,
  phone: form.phone?.trim() || undefined,
});
