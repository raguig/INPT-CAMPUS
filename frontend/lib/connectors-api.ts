import api from "@/lib/api";
import type {
  CampusConnector,
  ConnectorCreatePayload,
  ConnectorLog,
  ConnectorMessageResponse,
  ConnectorTestPayload,
  ConnectorTestResponse,
  ConnectorTypeMeta,
  ConnectorUpdatePayload,
} from "@/lib/connectors-types";

export async function fetchConnectors(): Promise<CampusConnector[]> {
  const { data } = await api.get<CampusConnector[]>("/connectors/");
  return data;
}

export async function fetchConnectorTypes(): Promise<ConnectorTypeMeta[]> {
  const { data } = await api.get<ConnectorTypeMeta[]>("/connectors/types");
  return data;
}

export async function fetchConnectorLogs(
  connectorId: number,
  limit = 10,
): Promise<ConnectorLog[]> {
  const { data } = await api.get<ConnectorLog[]>(
    `/connectors/${connectorId}/logs`,
    {
      params: { limit },
    },
  );
  return data;
}

export async function createConnector(
  payload: ConnectorCreatePayload,
): Promise<CampusConnector> {
  const { data } = await api.post<CampusConnector>("/connectors/", payload);
  return data;
}

export async function updateConnector(
  connectorId: number,
  payload: ConnectorUpdatePayload,
): Promise<CampusConnector> {
  const { data } = await api.patch<CampusConnector>(
    `/connectors/${connectorId}`,
    payload,
  );
  return data;
}

export async function deleteConnector(connectorId: number): Promise<void> {
  await api.delete(`/connectors/${connectorId}`);
}

export async function syncConnector(
  connectorId: number,
): Promise<ConnectorMessageResponse> {
  const { data } = await api.post<ConnectorMessageResponse>(
    `/connectors/${connectorId}/sync`,
  );
  return data;
}

export async function testConnector(
  payload: ConnectorTestPayload,
): Promise<ConnectorTestResponse> {
  const { data } = await api.post<ConnectorTestResponse>(
    "/connectors/test",
    payload,
  );
  return data;
}
