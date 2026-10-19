// Controls web visibility only. API, CLI, MCP and stored analyses remain available.
export const VIDEO_ANALYSIS_ENABLED: boolean = false;

export const APP_HOME_PATH = VIDEO_ANALYSIS_ENABLED ? "/dashboard" : "/social-publications";
