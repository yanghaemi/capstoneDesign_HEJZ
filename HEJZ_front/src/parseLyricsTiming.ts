export interface LyricsBlock {
  lines: string[];
  start: number;
  end: number;
}

export const parseLyricsTiming = (alignedWords: any[]): LyricsBlock[] => {
  const lines: { text: string; start: number; end: number }[] = [];
  let currentLine = '';
  let lineStart: number | null = null;

  alignedWords.forEach((wordObj) => {
    const word = wordObj.word;
    const start = wordObj.startS;
    const end = wordObj.endS;

    if (currentLine === '') lineStart = start;
    currentLine += word;

    if (word.includes('\n')) {
      lines.push({
        text: currentLine.replace('\n', '').trim(),
        start: lineStart!,
        end: end,
      });
      currentLine = '';
      lineStart = null;
    }
  });

  const blocks: LyricsBlock[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const line1 = lines[i];
    const line2 = lines[i + 1];

    if (line2) {
      blocks.push({
        lines: [line1.text, line2.text],
        start: line1.start,
        end: line2.end,
      });
    } else {
      // ✅ 마지막 줄만 있을 경우 빈 문자열 한 줄 추가
      blocks.push({
        lines: [line1.text, ' '],
        start: line1.start,
        end: line1.end,
      });
    }
  }

  return blocks;
};
