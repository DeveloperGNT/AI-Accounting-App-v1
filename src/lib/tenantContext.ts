let activeOrganizationId: string | null = null;

const ORGANIZATION_ID_HEADER = 'x-organization-id';

export const setActiveOrganizationId = (organizationId: string | null) => {
  activeOrganizationId = organizationId;
};

export const getActiveOrganizationId = () => activeOrganizationId;

export const applyTenantHeader = (headers: Record<string, unknown>) => {
  if (activeOrganizationId) {
    headers[ORGANIZATION_ID_HEADER] = activeOrganizationId;
  }
};
