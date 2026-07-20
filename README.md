# n8n-nodes-kordoc

[`kordoc`](https://github.com/chrisryugj/kordoc)를 사용해 HWP, HWPX, HWPML, PDF, XLS, XLSX, DOCX 문서를 Markdown 또는 구조화 JSON으로 변환하는 n8n 커뮤니티 노드입니다.

## 설치

### n8n Community Nodes

1. n8n에서 **Settings > Community Nodes**로 이동합니다.
2. **Install**을 누르고 `n8n-nodes-kordoc`를 입력합니다.
3. 설치 후 n8n을 다시 시작합니다.

자체 호스팅 환경에서는 n8n 사용자 디렉터리에서도 설치할 수 있습니다.

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-kordoc
```

Node.js 22 이상이 필요합니다.

## 사용법

1. 이전 노드에서 문서를 바이너리 데이터로 준비합니다. 기본 바이너리 속성명은 `data`입니다.
2. **KorDoc Parser** 노드를 추가합니다.
3. 다음 옵션을 설정하고 워크플로를 실행합니다.

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| Binary Property | `data` | 입력 문서가 들어 있는 바이너리 속성명 |
| Output Format | `markdown` | `markdown`은 변환된 문자열, `json`은 KorDoc의 구조화 파싱 결과를 반환 |
| Extract Images | `false` | 추출 이미지를 `image_0`, `image_1` 등의 출력 바이너리 속성으로 반환 |

Markdown 출력 예시:

```json
{
  "fileName": "example.hwpx",
  "content": "# 변환된 마크다운 내용...",
  "parsedAt": "2026-07-20T10:00:00.000Z"
}
```

`Output Format`이 `json`이면 `content`에 `fileType`, `markdown`, `blocks`, `metadata`, `outline`, `warnings`가 포함됩니다. 이미지 바이트는 JSON에 중복 저장하지 않으며, **Extract Images**를 켰을 때만 n8n 바이너리 출력으로 제공합니다.

입력 바이너리가 없거나 KorDoc이 파싱 오류를 반환하면 노드가 `NodeOperationError`를 발생시킵니다. n8n의 **Continue On Fail**을 켜면 실패한 입력은 워크플로를 중단하지 않고 `error` 필드로 반환됩니다.

## 개발

```bash
npm install
npm run build
npm test
```

빌드 결과는 `dist/`에 생성됩니다. `kordoc`는 GitHub upstream을 직접 참조하며, 매일 실행되는 GitHub Actions 워크플로가 새 커밋을 감지하면 패치 버전을 올리고 빌드한 뒤 커밋과 태그를 푸시합니다.

## 라이선스

MIT
