import {createBrowserApiRequest} from "@/lib/http";
import type {AnalysisListResponseContract} from "@/lib/models";
export function listLinkableAnalyses(token:string,brandId:string){return createBrowserApiRequest(token)<AnalysisListResponseContract>(`/analyses?brandId=${encodeURIComponent(brandId)}`);}
