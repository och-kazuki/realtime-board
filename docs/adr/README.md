# ADR の一覧

プロジェクト全体で確定した判断の一覧です。ADR に何を書くかは [ADR-001](001-what-to-record.md) にあります。

| 番号 | 判断 | 決めた人 |
|---|---|---|
| [ADR-001](001-what-to-record.md) | ADR に書くもの | ユーザーが決定 |
| [ADR-002](002-development-flow.md) | 開発の進め方 | Claude の提案をユーザーが承認 |
| [ADR-003](003-document-structure.md) | 設計書の分け方 | Claude の提案をユーザーが承認 |
| [ADR-004](004-languages.md) | 画面は TypeScript と React、サーバーは Go で作る | ユーザーが決定 |
| [ADR-005](005-websocket.md) | リアルタイムの通信に WebSocket を使う | ユーザーが決定 |
| [ADR-006](006-postgresql.md) | データの保存に PostgreSQL を使う | Claude の判断 |
| [ADR-007](007-single-repository.md) | 画面、サーバー、設計書を1つのリポジトリに置く | Claude の判断 |
| [ADR-008](008-edit-per-note.md) | 編集は付箋1枚を単位にする | Claude の判断 |
| [ADR-009](009-separate-state-from-transport.md) | 画面と付箋の状態の処理を、通信の処理から切り離す | Claude の判断 |
| [ADR-010](010-note-text-as-plain-text.md) | 付箋の文字は文字として表示する | Claude の判断 |
| [ADR-011](011-note-text-limit.md) | 付箋の文字数の上限は200字 | Claude の提案をユーザーが承認 |
| [ADR-012](012-note-position-and-stacking.md) | 付箋の位置と重なりの順番 | Claude の判断 |
| [ADR-013](013-count-note-text-by-code-points.md) | 付箋の文字数は Unicode のコードポイントで数える | Claude の提案をユーザーが承認 |
| [ADR-014](014-board-and-note-size.md) | ボードと付箋の大きさを固定し、位置を整数の px で表す | Claude の提案をユーザーが承認 |
| [ADR-015](015-share-only-committed-operations.md) | ドラッグ中と編集中の様子は共有しない | Claude の提案をユーザーが承認 |
| [ADR-016](016-note-id-by-browser.md) | 付箋の `id` はブラウザが UUID で決める | Claude の提案をユーザーが承認 |
