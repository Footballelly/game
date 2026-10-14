#!/usr/bin/env python3
"""Listes Chrono calculées depuis les feuilles de match du Fantasy Premier League (2016-17 → 2025-26). Écrit data/lists_fpl.js."""
import csv, json, collections, re, sys, importlib.util
spec = importlib.util.spec_from_file_location("b", "/home/claude/football-legends/build_fpl.py")
FPL = "/tmp/claude-0/fpl"
# on réutilise la lecture de build_fpl sans réécrire le fichier joueurs
src = open("/home/claude/football-legends/build_fpl.py").read().split("upd, add, used")[0]
g = {"__name__": "x"}; sys.argv = ["x", FPL]; exec(src, g)
SEASONS, CODE, NAME, info, display_name, norm = g["SEASONS"], g["CODE"], g["NAME"], g["info"], g["display_name"], g["norm"]
goals = collections.Counter(); apps = collections.defaultdict(collections.Counter)  # code -> club -> matchs joués
for s in SEASONS:
    raw = list(csv.DictReader(open(f"{FPL}/{s}/players_raw.csv", encoding="utf-8")))
    byid = {x["id"]: x["code"] for x in raw}; tcode = {x["team"]: CODE[int(x["team_code"])] for x in raw}
    rows = list(csv.DictReader(open(f"{FPL}/{s}/merged_gw.csv", encoding="utf-8", errors="replace")))
    has_team = "team" in rows[0]
    side = collections.defaultdict(dict)
    for r in rows: side[r["fixture"]]["h" if r["was_home"] == "True" else "a"] = r["opponent_team"]
    for r in rows:
        m = int(float(r["minutes"] or 0)); code = byid.get(r["element"])
        if not code or m <= 0: continue
        goals[code] += int(float(r["goals_scored"] or 0))
        if has_team: club = NAME.get(r["team"], r["team"])
        else:
            sd = side[r["fixture"]]; club = tcode.get(sd.get("a") if r["was_home"] == "True" else sd.get("h"))
        if club: apps[code][club] += 1
def item(code):
    i = info[code]; n = display_name(i); full = f"{i['first']} {i['second']}".strip()
    web = re.sub(r"^[A-Z]\.", "", i["web"]).strip()
    a = sorted({x for x in [full, web] if x and norm(x) != norm(n)})
    return {"n": n, "a": a} if a else {"n": n}
lists = []
top = [c for c, v in goals.most_common() if v >= 50]
lists.append({"id": "buteurs50", "lg": "pl", "t": "50 buts en PL depuis 2016", "kind": "player",
  "hint": f"Les {len(top)} joueurs qui ont marqué au moins 50 buts de Premier League entre 2016-17 et 2025-26 (buts marqués sur cette période uniquement).",
  "items": [item(c) for c in top]})
for club, lab in [("Liverpool","Liverpool"),("Arsenal","Arsenal"),("Man City","Manchester City"),("Man Utd","Manchester United"),("Chelsea","Chelsea"),("Tottenham","Tottenham")]:
    cs = [c for c in apps if apps[c][club] >= 50]
    cs.sort(key=lambda c: -apps[c][club])
    lists.append({"id": "club-" + norm(club).replace(" ", ""), "lg": "pl", "t": f"{lab} depuis 2016 : 50 matchs et plus", "kind": "player",
      "hint": f"Les {len(cs)} joueurs qui ont disputé au moins 50 matchs de Premier League avec {lab} entre 2016-17 et 2025-26.",
      "items": [item(c) for c in cs]})
out = "// Football Legends — listes Chrono calculées depuis les feuilles de match officielles du Fantasy Premier League (2016-17 → 2025-26).\n" \
      "// Source : dépôt vaastav/Fantasy-Premier-League (licence MIT). Généré par build_lists.py ; un match = au moins 1 minute jouée.\n" \
      "window.FL_LISTS = (window.FL_LISTS || []).concat(" + json.dumps(lists, ensure_ascii=False, indent=0) + ");\n"
open("/home/claude/game/data/lists_fpl.js", "w", encoding="utf-8").write(out)
for l in lists: print(l["id"], len(l["items"]), ", ".join(x["n"] for x in l["items"][:12]))

# ---------- Plus ou moins : buts en PL de 2016-17 à 2025-26 (au moins 20)
clubs_of = collections.defaultdict(list)
for code in apps:
    for club, k in apps[code].items(): clubs_of[code].append((k, club))
pm = []
for code, gl in goals.most_common():
    if gl < 20: break
    cl = [c for _, c in sorted(clubs_of[code], reverse=True)[:2]]
    pm.append({"n": display_name(info[code]), "g": gl, "c": " · ".join(cl)})
open("/home/claude/game/data/goals_fpl.js", "w", encoding="utf-8").write(
 "// Football Legends — Plus ou moins « ère moderne » : buts de Premier League marqués de 2016-17 à 2025-26 (saisons terminées, chiffres figés).\n"
 "// Source : feuilles de match officielles du Fantasy Premier League (dépôt vaastav/Fantasy-Premier-League, MIT). c = clubs principaux sur la période.\n"
 "window.FL_GOALS_MOD = " + json.dumps(pm, ensure_ascii=False, indent=0) + ";\n"
 "window.FL_PM_THEMES = Object.assign(window.FL_PM_THEMES || {}, {mod:{t:\"Buts en PL depuis 2016\", u:\"buts en PL depuis 2016\"}});\n")
print("PM moderne :", len(pm), pm[:3], pm[-1])
