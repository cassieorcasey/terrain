"""Hitung susunan wilayah 2x2 dari seed.json lalu tulis seed.sql.

Di grid 2x2, pasangan diagonal selalu membentuk perfect matching pada K4
(tiga kemungkinan). Bobot sebuah pasangan = jumlah tool yang ditempatkan di
kedua wilayah itu. Matching dengan bobot diagonal terkecil dipilih, supaya
tool dua-wilayah tidak jatuh ke tengah canvas. Seri dipecah dengan memilih
susunan yang paling dekat dengan urutan baca halaman Notion.

Pemakaian: python build_seed.py <seed.json> <seed.sql>
"""

import itertools
import json
import sys
from collections import defaultdict

CELLS = [(0, 0), (0, 1), (1, 0), (1, 1)]  # urutan baca: kiri-atas, kanan-atas, kiri-bawah, kanan-bawah


def pair_weights(data):
    regions = defaultdict(set)
    for p in data["placements"]:
        regions[p["tool"]].add(p["category"])
    weights = defaultdict(list)
    for tool, cats in regions.items():
        for a, b in itertools.combinations(sorted(cats), 2):
            weights[(a, b)].append(tool)
    return weights


def perfect_matchings(ids):
    a = ids[0]
    for b in ids[1:]:
        rest = [x for x in ids if x not in (a, b)]
        yield (tuple(sorted((a, b))), tuple(sorted(rest)))


def is_diagonal(c1, c2):
    return c1[0] != c2[0] and c1[1] != c2[1]


def choose_layout(data):
    cats = sorted(data["categories"], key=lambda c: c["notion_order"])
    ids = [c["id"] for c in cats]
    order = {c["id"]: c["notion_order"] for c in cats}
    weights = pair_weights(data)

    def w(pair):
        return len(weights.get(tuple(sorted(pair)), []))

    report = []
    for m in perfect_matchings(ids):
        report.append((sum(w(p) for p in m), m))
    best_weight = min(r[0] for r in report)
    best_matchings = {r[1] for r in report if r[0] == best_weight}

    candidates = []
    for perm in itertools.permutations(ids):
        cell = dict(zip(perm, CELLS))
        diag = tuple(sorted(
            tuple(sorted(p)) for p in itertools.combinations(perm, 2)
            if is_diagonal(cell[p[0]], cell[p[1]])
        ))
        if diag in {tuple(sorted(m)) for m in best_matchings}:
            # jarak ke urutan baca Notion
            dist = sum(abs(perm.index(i) - (order[i] - 1)) for i in ids)
            candidates.append((dist, perm))
    _, chosen = min(candidates)
    return dict(zip(chosen, CELLS)), report, weights


def q(v):
    if v is None:
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def arr(items):
    if not items:
        return "'{}'"
    return "array[" + ", ".join(q(i) for i in items) + "]::text[]"


def build_sql(data, layout):
    out = ["-- Dihasilkan oleh scripts/build_seed.py dari data/seed.json. Jangan diedit manual.",
           "begin;", ""]
    for c in data["categories"]:
        r, col = layout[c["id"]]
        out.append(
            "insert into toolstack.categories (id, name, icon, description, grid_row, grid_col) values "
            f"({q(c['id'])}, {q(c['name'])}, {q(c['icon'])}, {q(c.get('description'))}, {r}, {col});")
    out.append("")
    for t in data["tools"]:
        out.append(
            "insert into toolstack.tools (id, name, url, note, status) values "
            f"({q(t['id'])}, {q(t['name'])}, {q(t.get('url'))}, {q(t.get('note'))}, {q(t['status'])});")
    out.append("")
    for i, p in enumerate(data["placements"]):
        out.append(
            "insert into toolstack.placements "
            "(tool_id, category_id, group_name, display_name, description, workflows, sort_order) values "
            f"({q(p['tool'])}, {q(p['category'])}, {q(p.get('group'))}, {q(p.get('display_name'))}, "
            f"{q(p.get('description'))}, {arr(p['workflows'])}, {i});")
    out.append("")
    for i, m in enumerate(data["models"]):
        out.append(
            "insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values "
            f"({q(m['id'])}, {q(m['family'])}, {q(m['version'])}, {q(m['provider'])}, {q(m['status'])}, {i});")
    out.append("")
    for i, n in enumerate(data["needs"]):
        out.append(f"insert into toolstack.needs (id, name, sort_order) values ({q(n['id'])}, {q(n['name'])}, {i});")
        for j, t in enumerate(n["targets"]):
            out.append(
                "insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values "
                f"({q(n['id'])}, {q(t.get('model'))}, {q(t.get('tool'))}, {q(t['role'])}, {q(t.get('note'))}, {j});")
    out += ["", "commit;", ""]
    return "\n".join(out)


def main(src, dst):
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    layout, report, weights = choose_layout(data)

    names = {c["id"]: c["name"] for c in data["categories"]}
    print("Bobot pasangan wilayah (tool bersama):")
    for pair, tools in sorted(weights.items()):
        print(f"  {names[pair[0]]} - {names[pair[1]]}: {len(tools)} ({', '.join(tools)})")
    print("\nBobot diagonal tiap perfect matching:")
    for wt, m in report:
        print(f"  {wt}: " + " | ".join(f"{names[a]} - {names[b]}" for a, b in m))
    print("\nSusunan terpilih:")
    pos = {(0, 0): "kiri atas", (0, 1): "kanan atas", (1, 0): "kiri bawah", (1, 1): "kanan bawah"}
    for cid, cell in sorted(layout.items(), key=lambda x: x[1]):
        print(f"  {pos[cell]}: {names[cid]}")

    with open(dst, "w", encoding="utf-8") as f:
        f.write(build_sql(data, layout))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
