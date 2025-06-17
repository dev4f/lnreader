import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';

import { Button, IconButton, Portal } from 'react-native-paper';
import { ThemeColors } from '@theme/types';
import { ChapterInfo, NovelInfo } from '@database/types';
import { getString } from '@strings/translations';
import { Modal } from '@components';

interface DownloadCustomChapterModalProps {
  theme: ThemeColors;
  hideModal: () => void;
  modalVisible: boolean;
  novel: NovelInfo;
  chapters: ChapterInfo[];
  downloadChapters: (novel: NovelInfo, chapters: ChapterInfo[]) => void;
}

const DownloadCustomChapterModal = ({
  theme,
  hideModal,
  modalVisible,
  novel,
  chapters,
  downloadChapters,
}: DownloadCustomChapterModalProps) => {
  const [text, setText] = useState("0");

  const onDismiss = () => {
    hideModal();
    setText("0");
  };

  const onSubmit = () => {
    hideModal();
    // If the amount is a string, we assume it's a comma-separated list of chapter IDs or a range. Example: "1,2,3", "1-5" or "1,3-5"
    // Order and de-duplicate the IDs
    let ids = text
      .split(',')
      .flatMap(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i,
          );
        }
        return [Number(part)];
      })
      .filter(id => !isNaN(id));
    // Order the IDs
    ids.sort((a, b) => a - b);
    // De-duplicate the IDs
    ids = Array.from(new Set(ids));
    // Filter chapters by the provided IDs
    console.log(`Filtered IDs: ${ids}`);
    console.log(`All chapters: ${chapters.map(ch => ch.id)}`);
    // Filter chapters based on the index
    let filtered = chapters.filter((chapter, idx) => ids.includes(idx));
    console.log(
      `Downloading chapters: ${filtered.map(chapter => chapter.name).join(', ')}`
    );
    downloadChapters(
      novel,
      filtered
    );
  };
  const onChangeText = (txt: string) => {
    // allow only numbers, commas, and dashes
    const sanitizedText = txt.replace(/[^0-9,-]/g, '');
    setText(sanitizedText)
  };

  return (
    <Portal>
      <Modal visible={modalVisible} onDismiss={onDismiss}>
        <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
          {getString('novelScreen.download.customAmount')}
        </Text>
        <View style={styles.row}>
          <TextInput
            value={text.toString()}
            style={[{ color: theme.onSurface }, styles.marginHorizontal]}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
          />
        </View>
        <Button
          onPress={onSubmit}
          textColor={theme.onPrimary}
          buttonColor={theme.primary}
        >
          {getString('libraryScreen.bottomSheet.display.download')}
        </Button>
      </Modal>
    </Portal>
  );
};

export default DownloadCustomChapterModal;

const styles = StyleSheet.create({
  errorText: {
    color: '#FF0033',
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'center' },
  marginHorizontal: { marginHorizontal: 4 },
});
