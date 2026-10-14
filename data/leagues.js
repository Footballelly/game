// Football Legends — données des autres compétitions (Ligue 1, Liga, Serie A, Ligue des champions).
// Vérifié le 14/10/2026 sur Wikipedia (Pichichi Trophy, Capocannoniere, List of Ligue 1 top scorers,
// List of UEFA Champions League top scorers au 13/10/2026, listes des champions de France, d'Espagne et d'Italie).
(function(){
  const L = window.FL_LISTS = window.FL_LISTS || [];
  const tag = {ballondor:"monde", soulier:"pl", clubspl:"pl", ldc:"ldc", france98:"bleus", france18:"bleus"};
  L.forEach(l => { l.lg = l.lg || tag[l.id] || "pl"; });
  L.push(
   {id:"l1buteurs", lg:"l1", t:"Meilleurs buteurs de Ligue 1", hint:"Tous les meilleurs buteurs de Ligue 1 de 1990-91 à 2025-26, ex æquo compris.", kind:"player", items:[
    {n:"Jean-Pierre Papin", a:["jpp"]},{n:"Alen Bokšić", a:["boksic"]},{n:"Roger Boli", a:[]},{n:"Youri Djorkaeff", a:[]},{n:"Nicolas Ouédec", a:["ouedec"]},
    {n:"Patrice Loko", a:[]},{n:"Sonny Anderson", a:[]},{n:"Stéphane Guivarc'h", a:["guivarch"]},{n:"Sylvain Wiltord", a:[]},{n:"Djibril Cissé", a:["cisse"]},
    {n:"Pauleta", a:["pedro pauleta"]},{n:"Shabani Nonda", a:[]},{n:"Alexander Frei", a:[]},{n:"Karim Benzema", a:[]},{n:"André-Pierre Gignac", a:["gignac","apg"]},
    {n:"Mamadou Niang", a:[]},{n:"Moussa Sow", a:[]},{n:"Olivier Giroud", a:[]},{n:"Nenê", a:["nene"]},{n:"Zlatan Ibrahimović", a:["zlatan","ibra","ibrahimovic"]},
    {n:"Alexandre Lacazette", a:[]},{n:"Edinson Cavani", a:[]},{n:"Kylian Mbappé", a:["mbappe"]},{n:"Wissam Ben Yedder", a:["ben yedder","wby"]},
    {n:"Ousmane Dembélé", a:["dembele"]},{n:"Mason Greenwood", a:[]},{n:"Esteban Lepaul", a:[]}]},
   {id:"pichichi", lg:"liga", t:"Pichichi : meilleurs buteurs de Liga", hint:"Tous les lauréats du Pichichi de 1990-91 à 2025-26.", kind:"player", items:[
    {n:"Emilio Butragueño", a:["butragueno","el buitre"]},{n:"Manolo", a:[]},{n:"Bebeto", a:[]},{n:"Romário", a:["romario"]},{n:"Iván Zamorano", a:["zamorano"]},
    {n:"Juan Antonio Pizzi", a:["pizzi"]},{n:"Ronaldo Nazário", a:["ronaldo","r9","ronaldo nazario"]},{n:"Christian Vieri", a:["bobo vieri"]},{n:"Raúl", a:["raul","raul gonzalez"]},
    {n:"Salva", a:["salva ballesta"]},{n:"Diego Tristán", a:["tristan"]},{n:"Roy Makaay", a:[]},{n:"Diego Forlán", a:["forlan"]},{n:"Samuel Eto'o", a:["etoo"]},
    {n:"Ruud van Nistelrooy", a:["van nistelrooy","ruud"]},{n:"Dani Güiza", a:["guiza"]},{n:"Lionel Messi", a:["leo messi"]},{n:"Cristiano Ronaldo", a:["cr7","cristiano","ronaldo"]},
    {n:"Luis Suárez", a:["suarez"]},{n:"Karim Benzema", a:[]},{n:"Robert Lewandowski", a:["lewy"]},{n:"Artem Dovbyk", a:[]},{n:"Kylian Mbappé", a:["mbappe"]}]},
   {id:"capocannoniere", lg:"seriea", t:"Capocannoniere : meilleurs buteurs de Serie A", hint:"Tous les meilleurs buteurs de Serie A de 1990-91 à 2025-26, ex æquo compris.", kind:"player", items:[
    {n:"Gianluca Vialli", a:[]},{n:"Marco van Basten", a:["van basten"]},{n:"Giuseppe Signori", a:["beppe signori"]},{n:"Gabriel Batistuta", a:["batigol"]},{n:"Igor Protti", a:[]},
    {n:"Filippo Inzaghi", a:["pippo inzaghi","super pippo"]},{n:"Oliver Bierhoff", a:[]},{n:"Márcio Amoroso", a:["amoroso"]},{n:"Andriy Shevchenko", a:["sheva","chevtchenko"]},
    {n:"Hernán Crespo", a:["crespo"]},{n:"David Trezeguet", a:["trezegol"]},{n:"Dario Hübner", a:["hubner"]},{n:"Christian Vieri", a:["bobo vieri"]},{n:"Cristiano Lucarelli", a:[]},
    {n:"Luca Toni", a:[]},{n:"Francesco Totti", a:[]},{n:"Alessandro Del Piero", a:["del piero","alex del piero"]},{n:"Zlatan Ibrahimović", a:["zlatan","ibra","ibrahimovic"]},
    {n:"Antonio Di Natale", a:["di natale","toto di natale"]},{n:"Edinson Cavani", a:[]},{n:"Ciro Immobile", a:[]},{n:"Mauro Icardi", a:[]},{n:"Gonzalo Higuaín", a:["higuain","pipita"]},
    {n:"Edin Džeko", a:["dzeko"]},{n:"Fabio Quagliarella", a:[]},{n:"Cristiano Ronaldo", a:["cr7","cristiano","ronaldo"]},{n:"Victor Osimhen", a:[]},{n:"Lautaro Martínez", a:["lautaro","martinez"]},{n:"Mateo Retegui", a:[]}]},
   {id:"ldcbuteurs", lg:"ldc", t:"Les 24 meilleurs buteurs de l'histoire de la LDC", hint:"Le top 24 all-time de la Coupe des clubs champions et de la Ligue des champions (au 13/10/2026).", kind:"player", items:[
    {n:"Cristiano Ronaldo", a:["cr7","cristiano","ronaldo"]},{n:"Lionel Messi", a:["leo messi"]},{n:"Robert Lewandowski", a:["lewy"]},{n:"Karim Benzema", a:[]},{n:"Kylian Mbappé", a:["mbappe"]},
    {n:"Raúl", a:["raul"]},{n:"Erling Haaland", a:[]},{n:"Harry Kane", a:[]},{n:"Thomas Müller", a:["muller"]},{n:"Ruud van Nistelrooy", a:["van nistelrooy","ruud"]},
    {n:"Mohamed Salah", a:["mo salah"]},{n:"Thierry Henry", a:["titi"]},{n:"Alfredo Di Stéfano", a:["di stefano"]},{n:"Andriy Shevchenko", a:["sheva","chevtchenko"]},
    {n:"Zlatan Ibrahimović", a:["zlatan","ibra","ibrahimovic"]},{n:"Eusébio", a:["eusebio"]},{n:"Filippo Inzaghi", a:["pippo inzaghi"]},{n:"Didier Drogba", a:[]},
    {n:"Antoine Griezmann", a:["grizi"]},{n:"Neymar", a:["ney"]},{n:"Alessandro Del Piero", a:["del piero"]},{n:"Sergio Agüero", a:["aguero","kun"]},{n:"Ferenc Puskás", a:["puskas"]},{n:"Edinson Cavani", a:[]}]},
   {id:"champions3", lg:"europe", t:"Champions de Ligue 1, Liga ou Serie A", hint:"Tous les clubs champions de France, d'Espagne ou d'Italie depuis 1992-93.", kind:"club", items:[
    {n:"Paris Saint-Germain", a:["psg","paris sg","paris"]},{n:"Nantes", a:["fc nantes"]},{n:"Auxerre", a:["aja"]},{n:"Monaco", a:["as monaco","asm"]},{n:"Lens", a:["rc lens","rcl"]},
    {n:"Bordeaux", a:["girondins"]},{n:"Lyon", a:["ol","olympique lyonnais"]},{n:"Marseille", a:["om","olympique de marseille"]},{n:"Lille", a:["losc"]},{n:"Montpellier", a:["mhsc"]},
    {n:"FC Barcelone", a:["barca","barcelone","barcelona"]},{n:"Real Madrid", a:["real"]},{n:"Atlético Madrid", a:["atletico","atletico madrid","atleti"]},{n:"Deportivo La Corogne", a:["deportivo","depor","la corogne","la coruna"]},{n:"Valence", a:["valencia"]},
    {n:"Juventus", a:["juve"]},{n:"Inter Milan", a:["inter","internazionale"]},{n:"AC Milan", a:["milan"]},{n:"Lazio", a:["lazio rome"]},{n:"AS Rome", a:["roma","as roma"]},{n:"Naples", a:["napoli","ssc napoli"]}]}
  );

  // Plus ou moins, 2e thème : buts en Ligue des champions (joueurs qui ne la jouent plus, chiffres figés au 13/10/2026)
  window.FL_GOALS_UCL = [
   {n:"Cristiano Ronaldo",g:140,c:"Man Utd · Real Madrid · Juventus"},{n:"Lionel Messi",g:129,c:"FC Barcelone · PSG"},{n:"Karim Benzema",g:90,c:"Lyon · Real Madrid"},
   {n:"Raúl",g:71,c:"Real Madrid · Schalke"},{n:"Thomas Müller",g:57,c:"Bayern Munich"},{n:"Ruud van Nistelrooy",g:56,c:"PSV · Man Utd · Real Madrid"},
   {n:"Thierry Henry",g:50,c:"Monaco · Arsenal · FC Barcelone"},{n:"Alfredo Di Stéfano",g:49,c:"Real Madrid"},{n:"Andriy Shevchenko",g:48,c:"Dynamo Kiev · AC Milan · Chelsea"},
   {n:"Zlatan Ibrahimović",g:48,c:"Ajax · Juventus · Inter · Barça · Milan · PSG"},{n:"Eusébio",g:46,c:"Benfica"},{n:"Filippo Inzaghi",g:46,c:"Juventus · AC Milan"},
   {n:"Didier Drogba",g:44,c:"Marseille · Chelsea"},{n:"Neymar",g:43,c:"FC Barcelone · PSG"},{n:"Alessandro Del Piero",g:42,c:"Juventus"},{n:"Sergio Agüero",g:41,c:"Atlético · Man City"},
   {n:"Ferenc Puskás",g:36,c:"Real Madrid"},{n:"Edinson Cavani",g:35,c:"Napoli · PSG"},{n:"Gerd Müller",g:34,c:"Bayern Munich"},{n:"Fernando Morientes",g:33,c:"Real Madrid · Monaco"},
   {n:"Arjen Robben",g:31,c:"PSV · Chelsea · Real · Bayern"},{n:"Samuel Eto'o",g:30,c:"FC Barcelone · Inter"},{n:"Wayne Rooney",g:30,c:"Man Utd"},{n:"Kaká",g:30,c:"AC Milan · Real Madrid"},
   {n:"Paco Gento",g:30,c:"Real Madrid"},{n:"David Trezeguet",g:29,c:"Monaco · Juventus"},{n:"Roy Makaay",g:29,c:"Deportivo · Bayern"},{n:"Patrick Kluivert",g:29,c:"Ajax · AC Milan · FC Barcelone"},
   {n:"Jean-Pierre Papin",g:28,c:"Marseille · AC Milan"},{n:"Ryan Giggs",g:28,c:"Man Utd"},{n:"Sadio Mané",g:27,c:"Salzbourg · Liverpool · Bayern"},{n:"Rivaldo",g:27,c:"FC Barcelone · AC Milan"},
   {n:"Luis Suárez",g:27,c:"Ajax · Liverpool · FC Barcelone · Atlético"},{n:"Mario Gómez",g:26,c:"Stuttgart · Bayern"},{n:"Mário Jardel",g:25,c:"Porto · Galatasaray"},
   {n:"Robin van Persie",g:25,c:"Arsenal · Man Utd"},{n:"Hernán Crespo",g:25,c:"Parme · Lazio · Inter · AC Milan · Chelsea"}
  ];
  window.FL_PM_THEMES = {pl:{t:"Buts en Premier League", u:"buts en PL"}, ldc:{t:"Buts en Ligue des champions", u:"buts en LDC"}};
  window.FL_LEAGUES = {pl:"Premier League", l1:"Ligue 1", liga:"Liga", seriea:"Serie A", ldc:"Ligue des champions", europe:"Europe", monde:"Monde", bleus:"Équipe de France"};

  // Tenues des clubs étrangers pour les mini-joueurs (couleurs traditionnelles, sans logo)
  const K = window.FL_KITS = window.FL_KITS || {}, C = window.FL_CLUBS = window.FL_CLUBS || {};
  const add = (n, s, t, sh, so, p="plain") => { K[n] = {s, t, sh, so, p}; C[n] = C[n] || (s==="#f4f4f4" ? t : s); };
  add("PSG","#0b2a5b","#da291c","#0b2a5b","#0b2a5b","sleeves"); add("Marseille","#f4f4f4","#2fa9e0","#f4f4f4","#f4f4f4");
  add("Lyon","#f4f4f4","#1d3b8f","#f4f4f4","#f4f4f4"); add("Monaco","#e30613","#f4f4f4","#f4f4f4","#e30613","halves");
  add("Lens","#ffd200","#e30613","#111111","#ffd200","stripes"); add("Nantes","#fde200","#00843d","#fde200","#fde200");
  add("Auxerre","#f4f4f4","#0055a4","#0055a4","#f4f4f4"); add("Bordeaux","#0b1f4b","#f4f4f4","#f4f4f4","#0b1f4b");
  add("Rennes","#e30613","#111111","#111111","#e30613","halves"); add("Lille","#e30613","#0b1f4b","#0b1f4b","#e30613");
  add("Montpellier","#0b2a5b","#f68b1f","#0b2a5b","#0b2a5b"); add("Toulouse","#5b2d8e","#f4f4f4","#f4f4f4","#5b2d8e");
  add("Real Madrid","#f4f4f4","#c5a34a","#f4f4f4","#f4f4f4"); add("FC Barcelone","#a50044","#004d98","#004d98","#004d98","stripes");
  add("Atlético Madrid","#cb3524","#f4f4f4","#272e61","#cb3524","stripes"); add("Deportivo","#0057a8","#f4f4f4","#0057a8","#0057a8","stripes");
  add("Valence","#f4f4f4","#f08a00","#111111","#111111"); add("Villarreal","#ffe667","#005187","#ffe667","#ffe667");
  add("Mallorca","#c8102e","#111111","#111111","#111111"); add("Racing Santander","#f4f4f4","#00843d","#00843d","#f4f4f4");
  add("Tenerife","#f4f4f4","#0057a8","#0057a8","#f4f4f4"); add("Girona","#e30613","#f4f4f4","#0b1f4b","#e30613","stripes");
  add("Juventus","#f4f4f4","#111111","#f4f4f4","#f4f4f4","stripes"); add("AC Milan","#e30613","#111111","#f4f4f4","#111111","stripes");
  add("Inter Milan","#0057b8","#111111","#111111","#111111","stripes"); add("AS Rome","#8e1f2f","#f0bc42","#f4f4f4","#111111");
  add("Lazio","#87d8f7","#f4f4f4","#f4f4f4","#87d8f7"); add("Naples","#12a0d7","#f4f4f4","#f4f4f4","#12a0d7");
  add("Fiorentina","#5b2d8e","#f4f4f4","#f4f4f4","#5b2d8e"); add("Sampdoria","#0057a8","#e30613","#f4f4f4","#0057a8","hoops");
  add("Udinese","#111111","#f4f4f4","#111111","#111111","stripes"); add("Atalanta","#1e71b8","#111111","#111111","#111111","stripes");
  add("Torino","#8b1a1a","#f4f4f4","#f4f4f4","#8b1a1a"); add("Bari","#f4f4f4","#e30613","#f4f4f4","#f4f4f4");
  add("Piacenza","#e30613","#f4f4f4","#f4f4f4","#e30613"); add("Livourne","#8b1a1a","#f4f4f4","#8b1a1a","#8b1a1a");
  add("Hellas Vérone","#0b2a5b","#ffd200","#0b2a5b","#0b2a5b"); add("Bayern Munich","#dc052d","#f4f4f4","#dc052d","#dc052d");
  add("Benfica","#e30613","#f4f4f4","#f4f4f4","#e30613"); add("Ajax","#f4f4f4","#d2122e","#f4f4f4","#f4f4f4","halves");
  add("Dortmund","#fde100","#111111","#111111","#fde100"); add("Porto","#0057a8","#f4f4f4","#0057a8","#0057a8","stripes");
})();
