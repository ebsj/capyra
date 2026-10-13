import type { ApiError } from "@/lib/http";
import type {
  AnalysisDetailResponseContract,
  AnalysisListResponseContract,
  AnalysisSkillCatalogResponseContract,
} from "@/lib/models";

export type RemoteState<T> =
  | {
      status: "success";
      data: T;
    }
  | {
      status: "error";
      error: ApiError | Error;
    };

export async function loadRemote<T>(task: Promise<T> | (() => Promise<T>), fallbackMessage: string): Promise<RemoteState<T>> {
  try {
    const data = await (typeof task === "function" ? task() : task);
    return { status: "success", data };
  } catch (error) {
    if (error instanceof Error) {
      return { status: "error", error };
    }

    return { status: "error", error: new Error(fallbackMessage) };
  }
}

export function isRemoteSuccess<T>(state: RemoteState<T>): state is Extract<RemoteState<T>, { status: "success" }> {
  return state.status === "success";
}

export function loadAnalysisSkillCatalog(task: Promise<AnalysisSkillCatalogResponseContract> | (() => Promise<AnalysisSkillCatalogResponseContract>)) {
  return loadRemote(task, "Falha ao carregar catálogo de skills.");
}

export function loadAnalysisHistory(task: Promise<AnalysisListResponseContract> | (() => Promise<AnalysisListResponseContract>)) {
  return loadRemote(task, "Falha ao carregar histórico de análises.");
}

export function loadAnalysisDetail(task: Promise<AnalysisDetailResponseContract> | (() => Promise<AnalysisDetailResponseContract>)) {
  return loadRemote(task, "Falha ao carregar análise.");
}

export function submitAnalysis(task: Promise<AnalysisDetailResponseContract> | (() => Promise<AnalysisDetailResponseContract>)) {
  return loadRemote(task, "Falha ao enviar análise.");
}
