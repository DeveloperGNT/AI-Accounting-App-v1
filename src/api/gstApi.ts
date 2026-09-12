import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  GstRegisterResponse,
  GstSummaryResponse,
  GstPeriodParams,
} from './gstTypes';

// Backend controller: @Controller('organizations/:organizationId/gst/reports')
// with the app-wide global prefix → GET /api/v1/organizations/{organizationId}/
// gst/reports/{register}. The apiClient baseURL is already '/api/v1', so the
// service paths stay relative. organizationId must be the ACTIVE organization
// (the x-organization-id tenant header carries the same id; the backend's
// TenantAccessGuard validates that they match the member's tenant).
export const gstApi = {
  async outwardSupply(
    organizationId: string,
    params: GstPeriodParams,
  ): Promise<GstRegisterResponse> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/gst/reports/outward-supply`,
      { params },
    );
    return unwrapApiResponse<GstRegisterResponse>(response.data);
  },
  async inwardSupply(
    organizationId: string,
    params: GstPeriodParams,
  ): Promise<GstRegisterResponse> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/gst/reports/inward-supply`,
      { params },
    );
    return unwrapApiResponse<GstRegisterResponse>(response.data);
  },
  async summary(
    organizationId: string,
    params: GstPeriodParams,
  ): Promise<GstSummaryResponse> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/gst/reports/summary`,
      { params },
    );
    return unwrapApiResponse<GstSummaryResponse>(response.data);
  },
};
