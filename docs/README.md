# 設計書の地図

このフォルダにはリアルタイム共有ボードの要件と設計を置きます。1つのファイルには1つの段階、1つの画面、または1つの機能だけを書きます。

## 進め方

アプリは M1〜M4 の4段階で作ります（各段階の範囲は [overview.md](overview.md) にあります）。段階ごとに次の流れを繰り返します。

1. 要件：その段階で何ができればよいかと、受け入れ条件を `requirements/` に書く
2. 設計：その段階で増える画面と機能、変わる画面と機能の設計を、`screens/`、`features/`、`interfaces/` に書く
3. レビュー：要件と設計を読み比べ、AI にもレビューを頼む。レビューで確定した判断のうち、プロジェクト全体に関わるものを `adr/` に残す
4. 実装：受け入れ条件をテストにしながら作る。M1 と M2 のコードは AI が機能ごと（または画面の部品ごと）に分けて書き、1つ書くたびに自分で読んで、実装の意図と動く仕組みを AI に質問して確かめる。M3 以降のコードを誰が書くかは、その段階を始めるときに決める
5. 確認：受け入れ条件で動きを確かめ、実装と食い違った設計書を直す

1〜3 は設計の PR に、4〜5 は実装の PR にまとめます。設計の PR をマージしてから実装に入ります。

## 置き場所

| 場所 | 書くこと | ファイルの単位 |
|---|---|---|
| `overview.md` | 何を作るか、全体の構成、M1〜M4 の範囲 | 1つだけ |
| `requirements/` | 要件と受け入れ条件 | 段階ごと |
| `screens/` | 画面設計 | 画面ごと |
| `features/` | 機能設計 | 機能ごと |
| `interfaces/` | 画面とサーバーで共通の取り決め（データの形、メッセージの形） | 取り決めごと |
| `adr/` | プロジェクト全体で確定した判断（段階ごとに変わる判断と、保留している判断は書かない） | 判断ごと |

## 段階ごとに読むもの

| 段階 | 読むもの | 状態 |
|---|---|---|
| すべての段階 | [adr/README.md](adr/README.md)（確定した判断の一覧） | 判断が確定するたびに追加 |
| M1 1人用のボード | [requirements/m1.md](requirements/m1.md)、[screens/board.md](screens/board.md)、[features/notes.md](features/notes.md) | 要件、画面設計、機能設計はレビュー済みで、確定した判断を ADR-013〜016 に残した。実装も済み、受け入れ条件を自動テストと、Chrome、Edge、Firefox での手動の確認で確かめた |
| M2 みんなで見えるボード | [requirements/m2.md](requirements/m2.md)、[screens/board.md](screens/board.md)、[features/notes.md](features/notes.md)、[features/board-sync.md](features/board-sync.md)、[features/board-server.md](features/board-server.md)、[interfaces/messages.md](interfaces/messages.md) | 要件、画面設計、機能設計、取り決めはレビュー済みで、確定した判断を ADR-017〜021 に残した。実装はまだ |
| M3〜M4 | その段階を始めるときに書く | まだ書いていない |

最初に書いた設計メモ `design.md` は、M1 の設計書がそろったので削除しました。M2 以降で必要な部分は、git の履歴（コミット `97bd453` の `docs/design.md`）から取り出します。
