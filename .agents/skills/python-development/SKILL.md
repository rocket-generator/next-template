---
name: python-development
description: Develop python server backend and cli tools
---
# Python コーディング規約

**目的**

* チーム全体で **読みやすく・安全で・変更しやすいコード** を継続的に書ける状態にする
* ツールを最大限活用し、ヒューマンエラーを仕組みで未然に防ぐ

---

## 目次

1. [パッケージ管理 (uv)](mdc:#パッケージ管理-uv)
2. [フォーマッタ & リンター](mdc:#フォーマッタ--リンター)
3. [型ヒント (Type Hints)](mdc:#型ヒント-type-hints)
4. [命名規則](mdc:#命名規則)
5. [インポート順序](mdc:#インポート順序)
6. [レイアウト & スタイル](mdc:#レイアウト--スタイル)
7. [ドキュメンテーション (Docstrings)](mdc:#ドキュメンテーション-docstrings)
8. [関数・メソッド設計](mdc:#関数メソッド設計)
9. [例外処理](mdc:#例外処理)
10. [コレクション & 可変デフォルト](mdc:#コレクション--可変デフォルト)
11. [パフォーマンス指針](mdc:#パフォーマンス指針)
12. [テスト](mdc:#テスト)
13. [CI / 自動化](mdc:#ci--自動化)
14. [セキュリティ](mdc:#セキュリティ)
15. [参考資料](mdc:#参考資料)

---

## パッケージ管理 (uv)

| 目的          | ツール                                                                            | 運用ルール                                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 高速・再現性・シンプル | **uv**<br>([https://github.com/astral-sh/uv](mdc:https:/github.com/astral-sh/uv)) | - 依存管理は **`pyproject.toml`** + **`uv.lock`** をソース管理<br>- 新規追加は `uv pip install <pkg> -q`<br>- CI では `uv pip sync -q` でロックファイルに完全同期<br>- **pip / poetry / pipenv の混在禁止**<br>- グローバルインストールは行わず **venv or direnv** に統一 |
| セキュリティ      | uv + safety                                                                    | `uv pip audit` を週次 CI に追加し脆弱パッケージを検出                                                                                                                                                                                |

**Why uv?**

1. **ビルドキャッシュ**により Poetry/Pip × 5〜10 倍の速度
2. **ロックファイル**が deterministic (`uv.lock`) ― Dev/CI 共通で完全一致
3. **PEP 508** 準拠で extras / markers も正しく解決
4. pip と完全互換 CLI → 学習コストほぼゼロ

---

## フォーマッタ & リンター

| 目的               | 推奨ツール             | 備考                                   |
| ------------------ | ---------------------- | -------------------------------------- |
| 自動整形           | **Black**              | `pyproject.toml` で line-length 100    |
| インポート並び替え | **isort**              | Black と互換モード                     |
| 静的解析 & Lint    | **Ruff** or **Flake8** | PEP 8 違反・潜在バグ検出               |
| 型チェック         | **mypy**               | `strict = True` を CI に必須           |

---

## 型ヒント (Type Hints)

> **Type Hint は必須** — 関数・メソッド・クラス属性・変数すべてに付与する。

```python
from collections.abc import Sequence

def calculate_mean(values: Sequence[float]) -> float:
    total: float = sum(values)
    return total / len(values)
```

* `from __future__ import annotations` をモジュール先頭に追加
* **mypy strict** で *Any* を撲滅（外部ライブラリには `py.typed` を要求）

---

## 命名規則

| 対象                    | 規則                   | 例                          |
| ----------------------- | ---------------------- | --------------------------- |
| 変数 / 関数 / メソッド  | **snake\_case**        | `user_id`, `process_data()` |
| クラス                  | **PascalCase**         | `DataLoader`                |
| モジュール / パッケージ | **snake\_case**        | `data_utils.py`             |
| 定数                    | **UPPER\_SNAKE\_CASE** | `MAX_CONNECTIONS = 10`      |

> 略語も小文字に崩して統一 ― `url_parser`（**NG:** `URLParser`）

---

## インポート順序

1. **標準ライブラリ**
2. **サードパーティ**
3. **社内パッケージ**

空行でブロック分けし `isort` で自動整列。

```python
import datetime
import pathlib

import requests

from mypkg.core import settings
```

---

## レイアウト & スタイル

| ルール      | 説明                                     |
| ----------- | ---------------------------------------- |
| インデント  | **4 スペース**                           |
| 1 行長      | 100 文字 (docstring は 72)               |
| f-strings   | 文字列結合は f-string。一貫性優先        |
| 空行        | トップレベル定義間 2 行、メソッド間 1 行 |

---

## ドキュメンテーション (Docstrings)

```python
def fetch_user(user_id: str) -> "User":
    """ユーザー情報を取得する。

    Args:
        user_id: 取得対象ユーザーの ID。

    Returns:
        取得したユーザーオブジェクト。

    Raises:
        UserNotFoundError: 指定 ID が存在しない場合。
    """
```

* Google か NumPy スタイルに統一
* **public API** には必ず記載

---

## 関数・メソッド設計

| ガイドライン                  | 理由                         |
| ----------------------------- | -------------------------- |
| 1 関数 = 1 責務 (SRP)         | テスト容易・再利用性向上               |
| 引数 ≤ 5                      | 複雑化抑止。多い場合は dataclass で束ねる |
| デフォルト引数に mutable 不可 | `list`, `dict` を直接使わない     |

---

## 例外処理

* 独自例外を定義し、**`except Exception`** の多用禁止
* `logger.exception` でスタックトレースを保持
* リソース解放は **context manager** で行う

---

## コレクション & 可変デフォルト

```python
def add_item(value: str, items: list[str] | None = None) -> list[str]:
    items = items or []
    items.append(value)
    return items
```

---

## パフォーマンス指針

| 原則          | 具体策                        |
| ----------- | -------------------------- |
| 計測してから最適化   | `cProfile`, `perf_counter` |
| データ構造の選択    | `dict`, `set` で O(1) アクセス  |
| I/O を非同期化   | `asyncio`, `trio`          |
| CPU バウンド並列化 | `multiprocessing`          |

---

## テスト

| 項目      | 推奨                                |
| ------- | --------------------------------- |
| フレームワーク | **pytest**                        |
| カバレッジ   | `pytest-cov` で 90 % 以上            |
| モック     | `pytest-mocker` / `unittest.mock` |

---

## CI / 自動化

1. **pre-commit**: black → isort → ruff → mypy
2. **GitHub Actions**:

   * `uv pip sync` → Lint → 型チェック → テスト
3. **Release**: セマンティックバージョニング & 自動リリースノート

---

## セキュリティ

* 依存監査: `uv pip audit` + Dependabot
* 入力値は **pydantic** でバリデーション
* シークレットは Vault / GitHub Secrets に隔離

---

## 参考資料

* PEP 8 / PEP 484
* Google Python Style Guide
* **“Effective Python”** – Brett Slatkin
* **“Clean Code in Python”** – Mariano Anaya

---

### まとめ

* **Type Hint** と **snake\_case** は絶対遵守
* **uv** で高速・再現性のあるパッケージ管理
* ツールチェーンを CI に組み込み、**人より機械に任せる** 🚀
