import React, { memo, useEffect, useMemo, useRef } from 'react';
import { NativeEventEmitter, NativeModules, StatusBar } from 'react-native';
import WebView from 'react-native-webview';
import color from 'color';

import { useTheme } from '@hooks/persisted';
import { getString } from '@strings/translations';

import { getPlugin } from '@plugins/pluginManager';
import { MMKVStorage, getMMKVObject } from '@utils/mmkv/mmkv';
import {
  CHAPTER_GENERAL_SETTINGS,
  CHAPTER_READER_SETTINGS,
  ChapterGeneralSettings,
  ChapterReaderSettings,
  initialChapterGeneralSettings,
  initialChapterReaderSettings,
} from '@hooks/persisted/useSettings';
import { getBatteryLevelSync } from 'react-native-device-info';
import * as Speech from 'expo-speech';
import { PLUGIN_STORAGE } from '@utils/Storages';
import { useChapterContext } from '../ChapterContext';

type WebViewPostEvent = {
  type: string;
  data?: { [key: string]: string | number };
};

type WebViewReaderProps = {
  onPress(): void;
};

const onLogMessage = (payload: { nativeEvent: { data: string } }) => {
  const dataPayload = JSON.parse(payload.nativeEvent.data);
  if (dataPayload) {
    if (dataPayload.type === 'console') {
      /* eslint-disable no-console */
      console.info(`[Console] ${JSON.stringify(dataPayload.msg, null, 2)}`);
    }
  }
};

const { RNDeviceInfo } = NativeModules;
const deviceInfoEmitter = new NativeEventEmitter(RNDeviceInfo);

const assetsUriPrefix = __DEV__
  ? 'http://localhost:8088/assets'
  : 'file:///android_asset';

const WebViewReader: React.FC<WebViewReaderProps> = ({ onPress }) => {
  const {
    novel,
    chapter,
    chapterText: html,
    navigateChapter,
    saveProgress,
    nextChapter,
    prevChapter,
    webViewRef,
  } = useChapterContext();
  const theme = useTheme();
  const readerSettings = useMemo(
    () =>
      getMMKVObject<ChapterReaderSettings>(CHAPTER_READER_SETTINGS) ||
      initialChapterReaderSettings,
    // needed to preserve settings during chapter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapter.id],
  );
  const chapterGeneralSettings = useMemo(
    () =>
      getMMKVObject<ChapterGeneralSettings>(CHAPTER_GENERAL_SETTINGS) ||
      initialChapterGeneralSettings,
    // needed to preserve settings during chapter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapter.id],
  );
  const batteryLevel = useMemo(() => getBatteryLevelSync(), []);
  const plugin = getPlugin(novel?.pluginId);
  const pluginCustomJS = `file://${PLUGIN_STORAGE}/${plugin?.id}/custom.js`;
  const pluginCustomCSS = `file://${PLUGIN_STORAGE}/${plugin?.id}/custom.css`;
  const nextChapterScreenVisible = useRef<boolean>(false);

  useEffect(() => {
    const mmkvListener = MMKVStorage.addOnValueChangedListener(key => {
      switch (key) {
        case CHAPTER_READER_SETTINGS:
          webViewRef.current?.injectJavaScript(
            `reader.readerSettings.val = ${MMKVStorage.getString(
              CHAPTER_READER_SETTINGS,
            )}`,
          );
          break;
        case CHAPTER_GENERAL_SETTINGS:
          webViewRef.current?.injectJavaScript(
            `reader.generalSettings.val = ${MMKVStorage.getString(
              CHAPTER_GENERAL_SETTINGS,
            )}`,
          );
          break;
      }
    });

    const subscription = deviceInfoEmitter.addListener(
      'RNDeviceInfo_batteryLevelDidChange',
      (level: number) => {
        webViewRef.current?.injectJavaScript(
          `reader.batteryLevel.val = ${level}`,
        );
      },
    );
    return () => {
      subscription.remove();
      mmkvListener.remove();
    };
  }, [webViewRef]);
  return (
    <WebView
      ref={webViewRef}
      style={{ backgroundColor: readerSettings.theme }}
      allowFileAccess={true}
      originWhitelist={['*']}
      scalesPageToFit={true}
      showsVerticalScrollIndicator={false}
      javaScriptEnabled={true}
      onMessage={(ev: { nativeEvent: { data: string } }) => {
        __DEV__ && onLogMessage(ev);
        const event: WebViewPostEvent = JSON.parse(ev.nativeEvent.data);
        switch (event.type) {
          case 'hide':
            onPress();
            break;
          case 'next':
            nextChapterScreenVisible.current = true;
            navigateChapter('NEXT');
            break;
          case 'prev':
            navigateChapter('PREV');
            break;
          case 'save':
            if (event.data && typeof event.data === 'number') {
              saveProgress(event.data);
            }
            break;
          case 'speak':
            if (event.data && typeof event.data === 'string') {
              Speech.speak(event.data, {
                onDone() {
                  webViewRef.current?.injectJavaScript('tts.next?.()');
                },
                voice: readerSettings.tts?.voice?.identifier,
                pitch: readerSettings.tts?.pitch || 1,
                rate: readerSettings.tts?.rate || 1,
              });
            } else {
              webViewRef.current?.injectJavaScript('tts.next?.()');
            }
            break;
          case 'stop-speak':
            Speech.stop();
            break;
        }
      }}
      source={{
        baseUrl: !chapter.isDownloaded ? plugin?.site : undefined,
        headers: plugin?.imageRequestInit?.headers,
        method: plugin?.imageRequestInit?.method,
        body: plugin?.imageRequestInit?.body,
        html: `
        <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/index.css">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/pageReader.css">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/toolWrapper.css">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/tts.css">
              <style>
              :root {
                --StatusBar-currentHeight: ${StatusBar.currentHeight}px;
                --readerSettings-theme: ${readerSettings.theme};
                --readerSettings-padding: ${readerSettings.padding}px;
                --readerSettings-textSize: ${readerSettings.textSize}px;
                --readerSettings-textColor: ${readerSettings.textColor};
                --readerSettings-textAlign: ${readerSettings.textAlign};
                --readerSettings-lineHeight: ${readerSettings.lineHeight};
                --readerSettings-fontFamily: ${readerSettings.fontFamily};
                --theme-primary: ${theme.primary};
                --theme-onPrimary: ${theme.onPrimary};
                --theme-secondary: ${theme.secondary};
                --theme-tertiary: ${theme.tertiary};
                --theme-onTertiary: ${theme.onTertiary};
                --theme-onSecondary: ${theme.onSecondary};
                --theme-surface: ${theme.surface};
                --theme-surface-0-9: ${color(theme.surface)
                  .alpha(0.9)
                  .toString()};
                --theme-onSurface: ${theme.onSurface};
                --theme-surfaceVariant: ${theme.surfaceVariant};
                --theme-onSurfaceVariant: ${theme.onSurfaceVariant};
                --theme-outline: ${theme.outline};
                --theme-rippleColor: ${theme.rippleColor};
                }
                
                @font-face {
                  font-family: ${readerSettings.fontFamily};
                  src: url("file:///android_asset/fonts/${
                    readerSettings.fontFamily
                  }.ttf");
                }
                </style>

              <link rel="stylesheet" href="${pluginCustomCSS}">
              <style>${readerSettings.customCSS}</style>
            </head>
            <body class="${
              chapterGeneralSettings.pageReader ? 'page-reader' : ''
            }">
              <div class="transition-chapter" style="transform: ${
                nextChapterScreenVisible.current
                  ? 'translateX(-100%)'
                  : 'translateX(0%)'
              };
              ${chapterGeneralSettings.pageReader ? '' : 'display: none'}"
              ">${chapter.name}</div>
              <div id="LNReader-chapter">
                ${html}  
              </div>
              <div id="reader-ui"></div>
              </body>
              <script>
                var initialPageReaderConfig = ${JSON.stringify({
                  nextChapterScreenVisible: nextChapterScreenVisible.current,
                })};


                var initialReaderConfig = ${JSON.stringify({
                  readerSettings,
                  chapterGeneralSettings,
                  novel,
                  chapter,
                  nextChapter,
                  prevChapter,
                  batteryLevel,
                  autoSaveInterval: 2222,
                  DEBUG: __DEV__,
                  strings: {
                    finished: `${getString(
                      'readerScreen.finished',
                    )}: ${chapter.name.trim()}`,
                    nextChapter: getString('readerScreen.nextChapter', {
                      name: nextChapter?.name,
                    }),
                    noNextChapter: getString('readerScreen.noNextChapter'),
                  },
                })}
              </script>
              <script src="${assetsUriPrefix}/js/icons.js"></script>
              <script src="${assetsUriPrefix}/js/van.js"></script>
              <script src="${assetsUriPrefix}/js/text-vibe.js"></script>
              <script src="${assetsUriPrefix}/js/core.js"></script>
              <script src="${assetsUriPrefix}/js/index.js"></script>
              <script src="${pluginCustomJS}"></script>
              <script>
                ${readerSettings.customJS}
              </script>
          </html>
          `,
      }}
    />
  );
};

export default memo(WebViewReader);
