import { isMobilePlatform } from "@utils/platformPaths";
import { useDebugLog } from "@/features/debug/hooks/useDebugLog";
import { useAppSettingsController } from "@app/hooks/useAppSettingsController";
import { useCodeCssVars } from "@app/hooks/useCodeCssVars";
import { useDictationController } from "@app/hooks/useDictationController";
import { useLiquidGlassEffect } from "@app/hooks/useLiquidGlassEffect";
import i18next from "@/i18n/config";
import { useEffect, useRef } from "react";

export function useAppBootstrap() {
  const appSettingsState = useAppSettingsController();
  useCodeCssVars(appSettingsState.appSettings);

  const dictationState = useDictationController(appSettingsState.appSettings);
  const debugState = useDebugLog();

  const shouldReduceTransparency =
    appSettingsState.reduceTransparency || isMobilePlatform();

  useLiquidGlassEffect({
    reduceTransparency: shouldReduceTransparency,
    onDebug: debugState.addDebugEntry,
  });

  // 同步语言设置到 i18n
  const languageInitialized = useRef(false);
  useEffect(() => {
    if (!languageInitialized.current && appSettingsState.appSettings.language) {
      languageInitialized.current = true;
      i18next.changeLanguage(appSettingsState.appSettings.language);
    }
  }, [appSettingsState.appSettings.language]);

  return {
    ...appSettingsState,
    ...dictationState,
    ...debugState,
    shouldReduceTransparency,
  };
}
