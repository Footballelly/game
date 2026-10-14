#!/usr/bin/env python3
"""Football Legends — passages en Premier League 2016-17 → 2025-26 à partir des données officielles du Fantasy Premier League
(dépôt vaastav/Fantasy-Premier-League, licence MIT). Produit data/players_fpl.js qui complète FL_PLAYERS :
- joueurs déjà dans la base : leurs saisons à partir de 2016 sont remplacées par celles du FPL (avant 2016, on garde la base) ;
- nouveaux joueurs : arrivés en PL à partir de 2017-18 ET nés en 1998 ou après (sinon une partie de leur carrière pourrait manquer).
Un passage compte dès 1 minute jouée. Année = année de début de saison (2016 = 2016-17), comme le reste de la base."""
import csv, json, re, sys, unicodedata, collections, subprocess, os

FPL = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/fpl"
GAME = "/home/claude/game"
SEASONS = ["2016-17","2017-18","2018-19","2019-20","2020-21","2021-22","2022-23","2023-24","2024-25","2025-26"]
CODE = {3:"Arsenal",7:"Aston Villa",91:"Bournemouth",90:"Burnley",94:"Brentford",36:"Brighton",8:"Chelsea",31:"Crystal Palace",
        11:"Everton",54:"Fulham",2:"Leeds",13:"Leicester",14:"Liverpool",102:"Luton",43:"Man City",1:"Man Utd",4:"Newcastle",
        45:"Norwich",17:"Nottingham Forest",49:"Sheffield Utd",20:"Southampton",6:"Tottenham",57:"Watford",35:"West Brom",
        21:"West Ham",39:"Wolves",40:"Ipswich",56:"Sunderland",88:"Hull",25:"Middlesbrough",110:"Stoke",80:"Swansea",
        38:"Huddersfield",97:"Cardiff"}
NAME = {"Spurs":"Tottenham","Nott'm Forest":"Nottingham Forest","Man Utd":"Man Utd","Man City":"Man City","Sheffield Utd":"Sheffield Utd"}
POS = {"1":"GK","2":"DEF","3":"MID","4":"ATT"}
MIN_NEW = 3000   # minutes PL cumulées pour ajouter un nouveau joueur (éviter les inconnus)

def norm(s):
    s = unicodedata.normalize("NFD", s); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z ]", "", s.lower().replace("-", " ")).strip()

# ---------- joueurs existants
js = subprocess.run(["node","-e","global.window={};require('%s/data/players.js');console.log(JSON.stringify(window.FL_PLAYERS))" % GAME],
                    capture_output=True, text=True, check=True).stdout
P = json.loads(js)
pidx = collections.defaultdict(set)
for i, p in enumerate(P):
    for f in [p["n"], p.get("k","")] + p.get("a", []):
        if f: pidx[norm(f)].add(i)

# ---------- lecture FPL : saison -> code joueur -> {clubs avec minutes}, + infos
seen = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.Counter()))  # code -> season -> club -> minutes
info = {}
for s in SEASONS:
    y = int(s[:4]); raw = list(csv.DictReader(open(f"{FPL}/{s}/players_raw.csv", encoding="utf-8")))
    byid = {}
    for x in raw:
        code = x["code"]; byid[x["id"]] = code
        info[code] = {"first": x["first_name"], "second": x["second_name"], "web": x["web_name"], "pos": POS.get(x["element_type"], "MID"),
                      "dob": x.get("birth_date") if re.match(r"\d{4}-", x.get("birth_date") or "") else (info.get(code) or {}).get("dob", "")}
    gwp = f"{FPL}/{s}/merged_gw.csv"
    has_team = "team" in open(gwp, encoding="utf-8", errors="replace").readline().split(",")
    if has_team:
        for g in csv.DictReader(open(gwp, encoding="utf-8", errors="replace")):
            m = int(float(g["minutes"] or 0)); code = byid.get(g["element"])
            if m > 0 and code: seen[code][y][NAME.get(g["team"], g["team"])] += m
    else:  # 2016-20 sans colonne équipe : on la déduit du match (l'adversaire des joueurs du camp d'en face)
        tcode = {x["team"]: CODE[int(x["team_code"])] for x in raw}
        rows = list(csv.DictReader(open(gwp, encoding="utf-8", errors="replace")))
        side = collections.defaultdict(dict)   # fixture -> {"h": id équipe adverse vue par un joueur à domicile, "a": …}
        for g in rows: side[g["fixture"]]["h" if g["was_home"] == "True" else "a"] = g["opponent_team"]
        for g in rows:
            m = int(float(g["minutes"] or 0)); code = byid.get(g["element"])
            if m <= 0 or not code: continue
            sd = side[g["fixture"]]; mine = sd.get("a") if g["was_home"] == "True" else sd.get("h")  # l'adversaire de l'adversaire = mon équipe
            if mine in tcode: seen[code][y][tcode[mine]] += m
            else:  # match où un seul camp a des lignes : club de fin de saison
                x = next((r for r in raw if r["id"] == g["element"]), None)
                if x: seen[code][y][CODE[int(x["team_code"])]] += m

def stints(code):
    """liste de [club, debut, fin] à partir des saisons ; l'ordre dans une saison suit les journées pour 2020+ (approximatif sinon)"""
    out = []
    for y in sorted(seen[code]):
        for club in seen[code][y]:
            if out and out[-1][0] == club and out[-1][2] in (y, y - 1): out[-1][2] = y
            else: out.append([club, y, y])
    return out

OVERRIDE = {"Virgil":"Virgil van Dijk","De Gea":"David de Gea","Bernardo":"Bernardo Silva","Ederson M.":"Ederson","Bruno Moura":"Bruno Guimarães",
  "Adama":"Adama Traoré","Raúl":"Raúl Jiménez","Rúben":"Rúben Dias","Gabriel":"Gabriel Magalhães","Kepa":"Kepa Arrizabalaga","Albert Sambi":"Sambi Lokonga",
  "Son Heung-min":"Son Heung-min","Mario Jr.":"Mario Lemina","Antony dos Santos":"Antony","Danilo dos Santos de Oliveira":"Danilo","Darwin":"Darwin Núñez",
  "Tomiyasu Takehiro":"Takehiro Tomiyasu","Mitoma Kaoru":"Kaoru Mitoma","Hee Chan":"Hwang Hee-chan","Diogo J.":"Diogo Jota","Royal":"Emerson Royal",
  "Paquetá":"Lucas Paquetá","Andreas":"Andreas Pereira","Thiago":"Thiago Alcântara","Ricardo":"Ricardo Pereira","Emerson":"Emerson Palmieri","Cédric":"Cédric Soares",
  "Hegazi":"Ahmed Hegazi","Richarlison de Andrade":"Richarlison","André":"André Trindade","Jota Silva":"Jota Silva","Bruno":"Bruno Saltor","Alisson Becker":"Alisson"}
def display_name(i):
    f, s2, web = i["first"].strip(), i["second"].strip(), i["web"].strip()
    q = re.search(r"['\"‘’“”](.+?)['\"‘’“”]", f)
    if q: return OVERRIDE.get(q.group(1), q.group(1))
    webc = re.sub(r"^[A-Z]\.", "", web).strip()
    first = f.split()[0] if f else ""
    sw = s2.split()
    if webc and webc[0].islower(): n = f"{first} {webc}"                                        # « van Aanholt »
    elif webc and " " in webc and not webc.endswith("."):
        n = webc if norm(first) in norm(webc) else f"{first} {webc}"                             # « João Pedro » / « Alexis Mac Allister »
    elif webc and norm(webc) in [norm(w) for w in sw]: n = f"{first} {webc}"                     # « Bruno Fernandes »
    elif webc and norm(webc) == norm(first): n = webc if (sw and sw[0] in ("dos","da","das","do")) else (f"{first} {s2}" if (len(sw) == 1 or (sw and sw[0][0].islower())) else webc)
    elif webc and norm(webc) not in norm(f + " " + s2): n = webc                                 # surnom (Richarlison…)
    else: n = f"{first} {sw[-1]}" if sw else first
    for k, v in OVERRIDE.items():
        if norm(n) == norm(k) or norm(webc) == norm(k): return v
    if "." in n and sw: n = f"{first} {sw[-1]}"
    return n

# Carrière en PL AVANT 2016-17 (années = début de saison) pour des joueurs nés avant 1998, vérifiée à la main.
# [] = aucun match de PL avant 2016 (arrivé en Angleterre ou en PL après). Ces joueurs perdent le marqueur x.
PRE = {
 "Jordan Pickford":[["Sunderland",2015,2015]], "James Tarkowski":[], "Virgil van Dijk":[["Southampton",2015,2015]],
 "Andrew Robertson":[["Hull",2014,2014]], "Harry Maguire":[["Hull",2014,2014]], "Abdoulaye Doucoure":[], "Bernd Leno":[],
 "Nick Pope":[], "Granit Xhaka":[], "Alex Iwobi":[["Arsenal",2015,2015]], "Ben Mee":[["Burnley",2014,2014]],
 "Aaron Wan-Bissaka":[], "Pierre-Emile Højbjerg":[], "Jarrod Bowen":[], "Lucas Digne":[], "Marcus Rashford":[["Man Utd",2015,2015]],
 "Jordan Ayew":[["Aston Villa",2015,2015]], "Richarlison":[], "Youri Tielemans":[], "Dominic Calvert-Lewin":[], "Martin Dúbravka":[],
 "Joachim Andersen":[], "Conor Coady":[["Liverpool",2012,2012]], "Raúl Jiménez":[], "Callum Wilson":[["Bournemouth",2015,2015]],
 "Victor Lindelöf":[], "Leandro Trossard":[], "Maximilian Kilman":[], "Tyrone Mings":[["Bournemouth",2015,2015]], "Jan Bednarek":[],
 "David Raya":[], "Robert Sánchez":[], "Jefferson Lerma":[], "Nathan Redmond":[["Norwich",2013,2013],["Norwich",2015,2015]],
 "Dean Henderson":[], "Harvey Barnes":[], "Benjamin White":[], "Charlie Taylor":[], "Timothy Castagne":[], "Kyle Walker-Peters":[],
 "Issa Diop":[], "Jorginho":[], "Gylfi Sigurdsson":[["Swansea",2011,2011],["Tottenham",2012,2013],["Swansea",2014,2015]],
 "Yves Bissouma":[], "Will Hughes":[], "Jack Harrison":[], "Jack Grealish":[["Aston Villa",2013,2015]], "Mateo Kovačić":[],
 "Adama Traoré":[["Aston Villa",2015,2015]], "Kepa Arrizabalaga":[], "Joshua King":[["Bournemouth",2015,2015]],
 "Steve Cook":[["Bournemouth",2015,2015]], "Ryan Fraser":[["Bournemouth",2015,2015]], "Sean Longstaff":[],
 "Federico Fernández":[["Swansea",2014,2015]], "Diogo Jota":[], "Mohamed Salah":[["Chelsea",2013,2014]],
 "Son Heung-min":[["Tottenham",2015,2015]], "Roberto Firmino":[["Liverpool",2015,2015]], "N'Golo Kanté":[["Leicester",2015,2015]],
 "Paul Pogba":[["Man Utd",2011,2011]], "David de Gea":[["Man Utd",2011,2015]], "John Stones":[["Everton",2012,2015]],
 "Anthony Martial":[["Man Utd",2015,2015]], "Jesse Lingard":[["Man Utd",2014,2015]], "Dele Alli":[["Tottenham",2015,2015]],
 "Eric Dier":[["Tottenham",2014,2015]], "Georginio Wijnaldum":[["Newcastle",2015,2015]], "Bruno Fernandes":[], "Fabinho":[],
 "Rodri":[], "Alisson":[], "Ederson":[], "Bernardo Silva":[], "Rúben Dias":[], "Gabriel Magalhães":[], "Gabriel Jesus":[],
 "Alexandre Lacazette":[], "Pierre-Emerick Aubameyang":[], "Kevin De Bruyne":[["Chelsea",2013,2013],["Man City",2015,2015]],
 "Leroy Sané":[], "Aymeric Laporte":[], "Antonio Rüdiger":[], "Casemiro":[], "Raphaël Varane":[], "Lisandro Martinez":[],
 "Ollie Watkins":[], "Ivan Toney":[], "Bryan Mbeumo":[], "Emiliano Martinez":[["Arsenal",2015,2015]], "Christian Pulisic":[],
 "Hakim Ziyech":[], "Timo Werner":[], "Thiago Silva":[], "Luis Díaz":[], "Darwin Núñez":[], "Joelinton":[], "Bruno Guimarães":[],
 "Miguel Almirón":[], "Fabian Schär":[], "James Maddison":[], "Thomas Partey":[], "Martin Ødegaard":[], "Julián Alvarez":[],
}
upd, add, used = {}, [], {norm(p["n"]) for p in P}
for code, i in info.items():
    if code not in seen: continue
    full = f"{i['first']} {i['second']}".strip(); dn = display_name(i)
    forms = {norm(dn), norm(full), norm(f"{i['first'].split()[0]} {i['second'].split()[-1]}") if i['second'] else norm(dn)}
    hits = set().union(*[pidx.get(x, set()) for x in forms])
    st = stints(code)
    if not hits:
        key = norm(re.sub(r"^[A-Z]\.", "", i["web"])).replace(" ", "")
        clubs = {c for c, a, b in st if a <= 2017}
        if len(key) >= 4:
            hits = {k for k, p in enumerate(P) if key in norm(p["n"]).replace(" ", "")
                    and any(c in clubs and b >= 2014 for c, a, b in p["s"])}
    if len(hits) == 1:
        upd[P[next(iter(hits))]["n"]] = st
        continue
    if len(hits) > 1: continue
    first_year = min(seen[code]); total = sum(sum(c.values()) for c in seen[code].values())
    if total < MIN_NEW: continue
    # né en 1998 ou après : pas de carrière en PL avant 2016, parcours complet ; sinon on marque x (avant 2016 inconnu)
    complete = bool(re.match(r"\d{4}", i["dob"] or "")) and i["dob"][:4] >= "1998"
    n = dn if norm(dn) not in used else f"{i['first'].split()[0]} {i['second'].split()[-1]}"
    if norm(n) in used: continue
    used.add(norm(n))
    al = sorted({x for x in [full, i["web"] if "." not in i["web"] else "", f"{i['first'].split()[0]} {i['second'].split()[-1]}"] if x and norm(x) != norm(n)})
    if n in PRE:
        m = []
        for c, a, b in sorted(PRE[n] + st, key=lambda x: x[1]):
            if m and m[-1][0] == c and a <= m[-1][2] + 1: m[-1][2] = max(m[-1][2], b)
            else: m.append([c, a, b])
        st, complete = m, True
    e = {"n": n, "p": i["pos"], "s": st}
    if not complete: e["x"] = 1
    if al: e["a"] = al
    add.append(e)

add.sort(key=lambda e: e["n"])
clubs = sorted({s[0] for e in add for s in e["s"]} | {s[0] for v in upd.values() for s in v})
out = f"""// Football Legends — passages en Premier League de 2016-17 à 2025-26 (généré par build_fpl.py).
// Source : données officielles du Fantasy Premier League, dépôt vaastav/Fantasy-Premier-League (licence MIT). Un passage = au moins 1 minute jouée.
// upd : joueurs déjà dans la base (on remplace leurs saisons à partir de 2016) ; add : nouveaux joueurs (x = carrière avant 2016 inconnue, exclus du Parcours).
(function(){{
const upd = {json.dumps(upd, ensure_ascii=False)};
const add = {json.dumps(add, ensure_ascii=False)};
const P = window.FL_PLAYERS = window.FL_PLAYERS || [];
P.forEach(p => {{ const u = upd[p.n]; if(!u) return;
  const old = p.s.map(([c,a,b]) => [c, a, Math.min(b, 2015)]).filter(([,a,b]) => a <= b);
  const all = [...old, ...u].sort((x,y) => x[1]-y[1]), m = [];
  all.forEach(s => {{ const l = m[m.length-1]; if(l && l[0]===s[0] && s[1] <= l[2]+1) l[2] = Math.max(l[2], s[2]); else m.push([...s]); }});
  p.s = m; }});
add.forEach(e => P.push(e));
}})();
"""
open(f"{GAME}/data/players_fpl.js", "w", encoding="utf-8").write(out)
print(f"mis à jour : {len(upd)} | ajoutés : {len(add)} | clubs : {clubs}")
three = [e for e in add if len({s[0] for s in e['s']}) >= 3]
json.dump([{"code":c,"n":display_name(info[c]),"dob":info[c]["dob"],"min":sum(sum(v.values()) for v in seen[c].values()),"first":min(seen[c]),"s":stints(c)} for c in info if c in seen],open("/tmp/claude-0/fpl/all.json","w"),ensure_ascii=False)
print("nouveaux avec 3+ clubs :", len(three))
