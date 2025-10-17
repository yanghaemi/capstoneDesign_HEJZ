export interface AlignedWord {
  word: string;     // e.g. "[Verse]\n별빛 ", "아래 ", "그려\n"
  startS: number;   // 초
  endS: number;     // 초
  success?: boolean;
  palign?: number;
}

export interface LyricsBlock {
  lines: string[];  // [line1, line2]
  start: number;    // block start (첫 줄 시작)
  end: number;      // block end   (둘째 줄 끝)
}

type ParseOptions = {
  includeSectionTags?: boolean; // "[Verse]" 같은 것 라인에 포함할지
};

export function parseAlignedWordsToBlocks(
  alignedWords: AlignedWord[],
  opts: ParseOptions = { includeSectionTags: false }
): { blocks: LyricsBlock[]; fullLyrics: string } {
  const lines: { text: string; start: number; end: number }[] = [];

  let currentText = '';
  let lineStart: number | null = null;
  let lastEnd: number | null = null;

  const flushLine = () => {
    const text = currentText.trim();
    if (text.length > 0 && lineStart != null && lastEnd != null) {
      // 섹션 태그 제거 옵션
      const cleaned = opts.includeSectionTags ? text : text.replace(/\[(.*?)\]/g, '').trim();
      if (cleaned.length > 0) {
        lines.push({ text: cleaned, start: lineStart, end: lastEnd });
      }
    }
    currentText = '';
    lineStart = null;
    lastEnd = null;
  };

  for (const w of alignedWords) {
    const raw = w.word ?? '';
    // 단어 안에 \n 여러 개 있을 수 있음 → split
    const parts = raw.split(/\n/);

    for (let i = 0; i < parts.length; i++) {
      const piece = parts[i];

      if (currentText === '') lineStart = w.startS;  // 라인 시작시간 최초 세팅
      currentText += piece;
      lastEnd = w.endS; // 같은 토큰 내에서도 endS는 마지막 파트의 시간으로 유지

      // 개행이 있었다면(=split으로 쪼개졌다면) 라인 종료
      if (i < parts.length - 1) {
        flushLine();
      } else {
        // 마지막 조각에서는 아직 라인 종료 안 함 (다음 토큰을 기다림)
        // 단, 토큰이 개행으로 끝나는 케이스(원문처럼 "그려\n")는 위에서 flush 됨
      }

      // 토큰 단위 공백을 그대로 두면 문장 합칠 때 붙는 문제 방지 → 공백 하나 추가
      if (i === parts.length - 1) currentText += ' ';
    }
  }
  // 남은 라인 마무리
  flushLine();

  // 2줄씩 묶어서 블록 구성
  const blocks: LyricsBlock[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    if (l2) {
      blocks.push({
        lines: [l1.text, l2.text],
        start: l1.start,
        end: l2.end,
      });
    } else {
      // 홀수 개로 끝나면 마지막 줄만
      blocks.push({
        lines: [l1.text, ' '],
        start: l1.start,
        end: l1.end,
      });
    }
  }

  // API용 fullLyrics(그냥 줄마다 개행, 블록 경계와 무관)
  const fullLyrics = lines.map(l => l.text).join('\n');

  return { blocks, fullLyrics };
}
