import { apiFetch } from "./http";

export type ElectiveDto = {
  legacyId: string;
  code: string;
  name: string;
  facultyName?: string;
  department?: string;
  seatLimit: number;
  semester?: string;
};

export function getElectives() {
  return apiFetch<ElectiveDto[]>("/electives");
}

