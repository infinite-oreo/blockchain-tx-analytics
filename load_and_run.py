"""
load_and_run.py
Executes every query in analysis.sql and prints formatted results to the terminal.
Run this after generate_data.py.
"""

import sqlite3
import re
import textwrap

DB_FILE = "blockchain_analytics.db"
SQL_FILE = "analysis.sql"

# ── Helpers ──────────────────────────────────────────────────────────────────

def parse_queries(sql_text: str) -> list[tuple[str, str]]:
    """
    Extract (title, sql) pairs from the analysis file.
    Title is taken from the '-- Qn: ...' comment block above each query.
    """
    # Split on query boundaries (-- Q<n>:)
    pattern = re.compile(r"(-- Q\d+:.*?)(?=-- Q\d+:|$)", re.DOTALL)
    blocks = pattern.findall(sql_text)
    results = []
    for block in blocks:
        lines = block.strip().splitlines()
        # First line is the title comment
        title = lines[0].lstrip("- ").strip()
        # Remaining non-comment lines form the SQL
        sql_lines = [l for l in lines[1:] if not l.strip().startswith("--") or len(l.strip()) > 3]
        sql = "\n".join(sql_lines).strip()
        if sql:
            results.append((title, sql))
    return results


def print_table(title: str, cursor: sqlite3.Cursor, rows: list):
    print("\n" + "═" * 72)
    print(f"  {title}")
    print("═" * 72)

    if not rows:
        print("  (no rows returned)")
        return

    col_names = [d[0] for d in cursor.description]
    # Compute column widths
    widths = [len(c) for c in col_names]
    for row in rows:
        for i, val in enumerate(row):
            widths[i] = max(widths[i], len(str(val)))

    fmt = "  " + "  ".join(f"{{:<{w}}}" for w in widths)
    sep = "  " + "  ".join("-" * w for w in widths)

    print(fmt.format(*col_names))
    print(sep)
    for row in rows[:20]:   # cap at 20 rows for readability
        print(fmt.format(*[str(v) if v is not None else "NULL" for v in row]))
    if len(rows) > 20:
        print(f"  ... ({len(rows)} rows total, showing first 20)")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"Connecting to {DB_FILE} ...")
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row

    with open(SQL_FILE, "r") as f:
        sql_text = f.read()

    queries = parse_queries(sql_text)
    print(f"Found {len(queries)} queries to run.\n")

    for title, sql in queries:
        try:
            cur = conn.execute(sql)
            rows = cur.fetchall()
            print_table(title, cur, [tuple(r) for r in rows])
        except sqlite3.Error as e:
            print(f"\n[ERROR] {title}\n  {e}")

    conn.close()
    print("\n" + "═" * 72)
    print("  All queries complete.")
    print("═" * 72 + "\n")


if __name__ == "__main__":
    main()
