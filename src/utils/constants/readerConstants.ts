import { ReaderTheme } from '@hooks/persisted/useSettings';
import { MaterialDesignIconName } from '@type/icon';

export const presetReaderThemes: ReaderTheme[] = [
  { backgroundColor: '#FFFFFF', textColor: '#000000' },
  { backgroundColor: '#f5f5fa', textColor: '#111111' },
  { backgroundColor: '#F7DFC6', textColor: '#593100' },
  { backgroundColor: '#dce5e2', textColor: '#000000' },
  { backgroundColor: '#292832', textColor: '#CCCCCC' },
  {
    backgroundColor: '#000000',
    textColor: '#FFFFFFB3',
  },
];

interface TextAlignments {
  value: string;
  icon: MaterialDesignIconName;
}

export const textAlignments: TextAlignments[] = [
  { value: 'left', icon: 'format-align-left' },
  { value: 'center', icon: 'format-align-center' },
  { value: 'justify', icon: 'format-align-justify' },
  { value: 'right', icon: 'format-align-right' },
];

export interface Font {
  fontFamily: string;
  name: string;
}

export const readerFonts: Font[] = [
  { fontFamily: '', name: 'Original' },
  { fontFamily: 'lora', name: 'Lora' },
  { fontFamily: 'bookerlam', name: 'Bookerlam' },
  { fontFamily: 'bookerlam-sans', name: 'Bookerlam Sans' },
  { fontFamily: 'bookerly', name: 'Bookerly' },
  { fontFamily: 'futura', name: 'Futura' },
  { fontFamily: 'nunito', name: 'Nunito' },
  { fontFamily: 'noto-sans', name: 'Noto Sans' },
  { fontFamily: 'open-sans', name: 'Open Sans' },
  { fontFamily: 'arbutus-slab', name: 'Arbutus Slab' },
  { fontFamily: 'domine', name: 'Domine' },
  { fontFamily: 'lato', name: 'Lato' },
  { fontFamily: 'pt-serif', name: 'PT Serif' },
  { fontFamily: 'OpenDyslexic3-Regular', name: 'OpenDyslexic' },
];
