// Aspect ratio configuration
export const ASPECT_RATIOS = {
  '1:1': { value: 1, label: '1:1 Square' },
  '4:3': { value: 4 / 3, label: '4:3 Landscape' },
  '3:4': { value: 3 / 4, label: '3:4 Portrait' },
  '3:2': { value: 3 / 2, label: '3:2 Landscape' },
  '2:3': { value: 2 / 3, label: '2:3 Portrait' },
  '16:9': { value: 16 / 9, label: '16:9 Widescreen' },
  '21:9': { value: 21 / 9, label: '21:9 Ultrawide' },
  '5:4': { value: 5 / 4, label: '5:4 Classic' },
  '9:16': { value: 9 / 16, label: '9:16 Mobile' },
};

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;
