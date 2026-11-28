# ADR-018：WebSocket のライブラリに coder/websocket を使う

- 状態：確定
- 決めた人：Claude の提案をユーザーが承認
- 記録した日：2026-11-28

## 状況

Go の標準ライブラリには WebSocket のサーバーが含まれていないので、サーバーで使うライブラリを決める必要があった。

## 選択肢

- [coder/websocket](https://github.com/coder/websocket)
- [gorilla/websocket](https://github.com/gorilla/websocket)

## 決定

サーバーの WebSocket には coder/websocket を使う。

## 理由

- `context` に対応しているので、接続の後始末とサーバーの停止を `context` の取り消しでそろえて書ける
- 接続元（`Origin`）の確認と、メッセージの大きさの上限を、設定だけで入れられる
- 複数の goroutine から同じ接続に書き込んでも安全。gorilla/websocket では、1つの接続へ同時に書き込めるのは1つの goroutine だけという決まりを、使う側で守る必要がある

## 受け入れたトレードオフ

- gorilla/websocket より、解説や例が少ない
- `Ping` は応答が届くまで待つので、生存確認を入れるときは専用の goroutine が要る
