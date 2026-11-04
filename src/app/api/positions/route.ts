import { type NextRequest } from "next/server";
import { proxyCompanyStructure } from "@/lib/server/company-structure-proxy";

export function GET(request: NextRequest) { return proxyCompanyStructure(request, "positions"); }
export function POST(request: NextRequest) { return proxyCompanyStructure(request, "positions"); }
