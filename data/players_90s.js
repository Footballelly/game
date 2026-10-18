// Football Legends — joueurs de Premier League des années 1992 à 2004 (ajout du 18/10/2026).
// Une ligne = Nom | postes | passages "Club début-fin" séparés par des virgules (année de début de saison, bornes incluses) | autres écritures (;)
// Les joueurs déjà présents dans la base gagnent leurs passages manquants ; les autres sont ajoutés.
(function(){
const RAW = `
Peter Schmeichel|GK|Man Utd 1992-1998, Aston Villa 2001, Man City 2002|schmeichel
Eric Cantona|ATT|Leeds 1992, Man Utd 1992-1996|cantona
Mark Hughes|ATT|Man Utd 1992-1994, Chelsea 1995-1997, Southampton 1998-1999, Everton 1999, Blackburn 2001|sparky
Steve Bruce|DEF|Man Utd 1992-1995
Gary Pallister|DEF|Man Utd 1992-1997, Middlesbrough 1998-2000|pallister
Denis Irwin|DEF|Man Utd 1992-2001, Wolves 2003|irwin
Paul Ince|MID|Man Utd 1992-1994, Liverpool 1997-1998, Middlesbrough 1999-2001, Wolves 2003|ince
Lee Sharpe|MID|Man Utd 1992-1995, Leeds 1996-1998, Bradford 1999-2000
Andrei Kanchelskis|MID|Man Utd 1992-1994, Everton 1995-1996, Man City 2000, Southampton 2002|kanchelskis
Brian McClair|MID ATT|Man Utd 1992-1997|mcclair
Andy Cole|ATT|Newcastle 1993-1994, Man Utd 1994-2001, Blackburn 2001-2003, Fulham 2004, Man City 2005, Portsmouth 2006, Sunderland 2007|andrew cole
Nicky Butt|MID|Man Utd 1992-2003, Newcastle 2004-2008, Birmingham 2005|butt
David Beckham|MID|Man Utd 1994-2002|beckham
Paul Scholes|MID|Man Utd 1994-2012|scholes
Phil Neville|DEF MID|Man Utd 1994-2004, Everton 2005-2012|p neville
Ole Gunnar Solskjær|ATT|Man Utd 1996-2006|solskjaer;ole
Teddy Sheringham|ATT|Nottingham Forest 1992, Tottenham 1992-1996, Man Utd 1997-2000, Tottenham 2001-2002, Portsmouth 2003, West Ham 2005-2006|sheringham
Dwight Yorke|ATT|Aston Villa 1992-1997, Man Utd 1998-2001, Blackburn 2002-2003, Birmingham 2004, Sunderland 2007|yorke
Jaap Stam|DEF|Man Utd 1998-2001|stam
Ronny Johnsen|DEF|Man Utd 1996-2001, Aston Villa 2002-2003, Newcastle 2004
Henning Berg|DEF|Blackburn 1992-1996, Man Utd 1997-1999, Blackburn 2001-2002
Mikaël Silvestre|DEF|Man Utd 1999-2007, Arsenal 2008-2009|silvestre
Fabien Barthez|GK|Man Utd 2000-2003|barthez
Juan Sebastián Verón|MID|Man Utd 2001-2002, Chelsea 2003|veron
Ruud van Nistelrooy|ATT|Man Utd 2001-2005|van nistelrooy;ruud;rvn
Laurent Blanc|DEF|Man Utd 2001-2002|blanc
Roy Carroll|GK|Man Utd 2001-2004, West Ham 2005, Derby 2007
Jordi Cruyff|MID|Man Utd 1996-1999|cruyff
Karel Poborský|MID|Man Utd 1996-1997|poborsky
Quinton Fortune|MID|Man Utd 1999-2005, Bolton 2006
Diego Forlán|ATT|Man Utd 2001-2004|forlan
Kléberson|MID|Man Utd 2003-2004|kleberson
Eric Djemba-Djemba|MID|Man Utd 2003-2004, Aston Villa 2004-2006|djemba djemba
David May|DEF|Blackburn 1992-1993, Man Utd 1994-2002
Paul Parker|DEF|Man Utd 1992-1995
Mark Bosnich|GK|Aston Villa 1992-1998, Man Utd 1999, Chelsea 2001|bosnich
Gabriel Heinze|DEF|Man Utd 2004-2006|heinze
Henrik Larsson|ATT|Man Utd 2006|larsson
Roy Keane|MID|Nottingham Forest 1992, Man Utd 1993-2005|keano
Ryan Giggs|MID ATT|Man Utd 1992-2013|giggs
David Seaman|GK|Arsenal 1992-2002, Man City 2003|seaman
Tony Adams|DEF|Arsenal 1992-2001|adams
Lee Dixon|DEF|Arsenal 1992-2001|dixon
Nigel Winterburn|DEF|Arsenal 1992-1999, West Ham 2000-2002|winterburn
Steve Bould|DEF|Arsenal 1992-1998, Sunderland 1999|bould
Martin Keown|DEF|Everton 1992, Arsenal 1992-2003|keown
Ian Wright|ATT|Arsenal 1992-1997, West Ham 1998-1999|wrighty
Paul Merson|MID|Arsenal 1992-1996, Middlesbrough 1998, Aston Villa 1998-2001|merson
Ray Parlour|MID|Arsenal 1992-2003, Middlesbrough 2004-2006|parlour
Patrick Vieira|MID|Arsenal 1996-2004, Man City 2009-2010|vieira
Emmanuel Petit|MID|Arsenal 1997-1999, Chelsea 2001-2003|petit;manu petit
Marc Overmars|ATT|Arsenal 1997-1999|overmars
Nicolas Anelka|ATT|Arsenal 1996-1998, Liverpool 2001, Man City 2002-2004, Bolton 2006-2007, Chelsea 2007-2011, West Brom 2013|anelka
Kanu|ATT|Arsenal 1998-2003, West Brom 2004, Portsmouth 2006-2009|nwankwo kanu
Freddie Ljungberg|MID|Arsenal 1998-2006, West Ham 2007|ljungberg
Sylvain Wiltord|ATT|Arsenal 2000-2003|wiltord
Robert Pirès|MID|Arsenal 2000-2005, Aston Villa 2010|pires
Lauren|DEF|Arsenal 2000-2006, Portsmouth 2006-2007
Oleg Luzhny|DEF|Arsenal 1999-2002|luzhny
John Hartson|ATT|Arsenal 1994-1996, West Ham 1996-1998, Wimbledon 1998-1999, Coventry 2000|hartson
Kevin Campbell|ATT|Arsenal 1992-1994, Nottingham Forest 1995-1996, Everton 1998-2004, West Brom 2004
Anders Limpar|MID|Arsenal 1992-1993, Everton 1993-1996|limpar
John Jensen|MID|Arsenal 1992-1995
Stefan Schwarz|MID|Arsenal 1994, Sunderland 1999-2002|schwarz
Davor Šuker|ATT|Arsenal 1999, West Ham 2000|suker
Gilles Grimandi|DEF|Arsenal 1997-2001|grimandi
Rémi Garde|MID|Arsenal 1996-1998|remi garde
Alex Manninger|GK|Arsenal 1997-2000|manninger
Giovanni van Bronckhorst|MID|Arsenal 2001-2002|van bronckhorst;gio
Edu|MID|Arsenal 2000-2004
David Platt|MID|Arsenal 1995-1997|platt
Jens Lehmann|GK|Arsenal 2003-2007, 2010|lehmann
Paul Dickov|ATT|Arsenal 1992-1995, Leicester 2001, 2003, Blackburn 2004-2005, Man City 2006|dickov
Sol Campbell|DEF|Tottenham 1992-2000, Arsenal 2001-2005, Portsmouth 2006-2008, Arsenal 2009, Newcastle 2010|sol
Gianfranco Zola|ATT|Chelsea 1996-2002|zola
Dennis Wise|MID|Chelsea 1992-2000, Leicester 2001|wise
Graeme Le Saux|DEF|Chelsea 1992, Blackburn 1992-1996, Chelsea 1997-2002, Southampton 2003-2004|le saux
Ruud Gullit|MID|Chelsea 1995-1997|gullit
Gianluca Vialli|ATT|Chelsea 1996-1998|vialli
Roberto Di Matteo|MID|Chelsea 1996-2000|di matteo
Frank Leboeuf|DEF|Chelsea 1996-2000|leboeuf
Marcel Desailly|DEF|Chelsea 1998-2003|desailly
Didier Deschamps|MID|Chelsea 1999|deschamps
Gus Poyet|MID|Chelsea 1997-2000, Tottenham 2001-2003|poyet
Tore André Flo|ATT|Chelsea 1997-2000, Sunderland 2002|flo
Dan Petrescu|DEF MID|Sheffield Wed 1994-1995, Chelsea 1995-1999, Bradford 2000, Southampton 2000-2001|petrescu
Ed de Goey|GK|Chelsea 1997-2002|de goey
Albert Ferrer|DEF|Chelsea 1998-2002|ferrer
Celestine Babayaro|DEF|Chelsea 1997-2004, Newcastle 2004-2007|babayaro
Jimmy Floyd Hasselbaink|ATT|Leeds 1997-1998, Chelsea 2000-2003, Middlesbrough 2004-2005, Charlton 2006|hasselbaink
John Spencer|ATT|Chelsea 1992-1996, Everton 1996-1997
Mark Stein|ATT|Chelsea 1993-1995
Dmitri Kharine|GK|Chelsea 1992-1998|kharine
Eddie Newton|MID|Chelsea 1992-1998
Steve Clarke|DEF|Chelsea 1992-1997
Michael Duberry|DEF|Chelsea 1993-1998, Leeds 1999-2003|duberry
Chris Sutton|ATT|Norwich 1992-1993, Blackburn 1994-1998, Chelsea 1999, Birmingham 2005, Aston Villa 2006|sutton
Mario Melchiot|DEF|Chelsea 1999-2003, Birmingham 2004-2005, Wigan 2007-2009|melchiot
Winston Bogarde|DEF|Chelsea 2000-2003|bogarde
Boudewijn Zenden|MID|Chelsea 2001-2002, Middlesbrough 2003-2004, Liverpool 2005-2006, Sunderland 2009-2010|bolo zenden;zenden
Jesper Grønkjær|MID|Chelsea 2000-2003, Birmingham 2004|gronkjaer
Hernán Crespo|ATT|Chelsea 2003, 2005|crespo
Adrian Mutu|ATT|Chelsea 2003-2004|mutu
Frank Sinclair|DEF|Chelsea 1992-1997, Leicester 1998-2001, 2003
Craig Burley|MID|Chelsea 1992-1996, Derby 1999-2001
Christian Panucci|DEF|Chelsea 2000|panucci
Graham Stuart|MID|Chelsea 1992, Everton 1993-1997, Charlton 1998, 2000-2003, Norwich 2004
Robbie Fowler|ATT|Liverpool 1993-2001, Leeds 2001-2002, Man City 2003-2005, Liverpool 2005-2006|god;fowler
Steve McManaman|MID|Liverpool 1992-1998, Man City 2003-2004|macca;mcmanaman
Ian Rush|ATT|Liverpool 1992-1995, Leeds 1996, Newcastle 1997|rush
John Barnes|MID|Liverpool 1992-1996, Newcastle 1997-1998, Charlton 1998|barnes
Jamie Redknapp|MID|Liverpool 1992-2001, Tottenham 2002-2004, Southampton 2004|redknapp
Stan Collymore|ATT|Nottingham Forest 1994, Liverpool 1995-1996, Aston Villa 1997-1999, Leicester 1999-2000, Bradford 2000|collymore
David James|GK|Liverpool 1992-1998, Aston Villa 1999-2000, West Ham 2001-2002, Man City 2003-2005, Portsmouth 2006-2009
Bruce Grobbelaar|GK|Liverpool 1992-1993, Southampton 1994-1995|grobbelaar
Neil Ruddock|DEF|Tottenham 1992, Liverpool 1993-1997, West Ham 1998-1999|razor;ruddock
Mark Wright|DEF|Liverpool 1992-1997
Phil Babb|DEF|Liverpool 1994-1999, Sunderland 2002|babb
John Scales|DEF|Wimbledon 1992-1994, Liverpool 1994-1996, Tottenham 1996-1999|scales
Stig Inge Bjørnebye|DEF|Liverpool 1992-1999, Blackburn 2001-2002|bjornebye
Rob Jones|DEF|Liverpool 1992-1997
Jason McAteer|MID|Bolton 1995, Liverpool 1995-1998, Blackburn 1998, Sunderland 2001-2002|mcateer
Patrik Berger|MID|Liverpool 1996-2002, Portsmouth 2003-2004, Aston Villa 2005-2007|berger
Karl-Heinz Riedle|ATT|Liverpool 1997-1998|riedle
Michael Owen|ATT|Liverpool 1996-2003, Newcastle 2005-2008, Man Utd 2009-2011, Stoke 2012|owen
Sami Hyypiä|DEF|Liverpool 1999-2008|hyypia
Stéphane Henchoz|DEF|Blackburn 1997-1998, Liverpool 1999-2004, Wigan 2005-2007|henchoz
Dietmar Hamann|MID|Newcastle 1998, Liverpool 1999-2005, Man City 2006-2008|hamann;didi
Markus Babbel|DEF|Liverpool 2000-2002, Blackburn 2003|babbel
Gary McAllister|MID|Leeds 1992-1995, Coventry 1996-1999, Liverpool 2000-2001|mcallister
Emile Heskey|ATT|Leicester 1996-1999, Liverpool 1999-2003, Birmingham 2004-2005, Wigan 2006-2008, Aston Villa 2008-2011|heskey
Vladimír Šmicer|MID|Liverpool 1999-2004|smicer
Jerzy Dudek|GK|Liverpool 2001-2006|dudek
Sander Westerveld|GK|Liverpool 1999-2001|westerveld
Titi Camara|ATT|Liverpool 1999, West Ham 2000-2002|camara
Nick Barmby|MID|Tottenham 1992-1994, Middlesbrough 1995, Everton 1996-1999, Liverpool 2000-2001, Leeds 2002-2003, Hull 2008|barmby
Milan Baroš|ATT|Liverpool 2002-2004, Aston Villa 2005-2006, Portsmouth 2007|baros
El-Hadji Diouf|ATT|Liverpool 2002-2003, Bolton 2004-2007, Sunderland 2008, Blackburn 2008-2010|diouf
Igor Bišćan|MID|Liverpool 2000-2004|biscan
Djimi Traoré|DEF|Liverpool 1999-2005, Portsmouth 2006-2008|traore
Abel Xavier|DEF|Everton 1999-2001, Liverpool 2001-2002, Middlesbrough 2005|xavier
Michael Thomas|MID|Liverpool 1992-1997
Steve Staunton|DEF|Aston Villa 1992-1997, Liverpool 1998-2000, Aston Villa 2000-2002|staunton
Dominic Matteo|DEF|Liverpool 1993-1999, Leeds 2000-2003, Blackburn 2004-2005|matteo
Jari Litmanen|ATT|Liverpool 2000-2001|litmanen
Fernando Morientes|ATT|Liverpool 2004-2005|morientes
Nigel Clough|ATT|Nottingham Forest 1992, Liverpool 1993-1995, Man City 1995
Ronny Rosenthal|ATT|Liverpool 1992-1993, Tottenham 1993-1996|rosenthal
Don Hutchison|MID|Liverpool 1992-1993, West Ham 1994-1995, Everton 1997-1999, Sunderland 2000, West Ham 2001-2002|hutchison
Peter Beardsley|ATT|Everton 1992, Newcastle 1993-1996, Bolton 1997|beardsley
Les Ferdinand|ATT|QPR 1992-1994, Newcastle 1995-1996, Tottenham 1997-2002, West Ham 2002, Leicester 2003, Bolton 2004|sir les;ferdinand
David Ginola|MID|Newcastle 1995-1996, Tottenham 1997-1999, Aston Villa 2000-2001, Everton 2001|ginola
Faustino Asprilla|ATT|Newcastle 1995-1997|asprilla;tino
Robert Lee|MID|Newcastle 1993-2001, Derby 2001|rob lee
Philippe Albert|DEF|Newcastle 1994-1998|albert
Shaka Hislop|GK|Newcastle 1995-1997, West Ham 1998-2001, Portsmouth 2003-2004, West Ham 2005|hislop
Pavel Srníček|GK|Newcastle 1993-1997, Sheffield Wed 1998|srnicek
Shay Given|GK|Newcastle 1997-2008, Man City 2008-2010, Aston Villa 2011-2014, Stoke 2015-2016|given
Warren Barton|DEF|Wimbledon 1992-1994, Newcastle 1995-2001, Derby 2001
John Beresford|DEF|Newcastle 1993-1997, Southampton 1997-1998
Darren Peacock|DEF|QPR 1992-1993, Newcastle 1993-1997, Blackburn 1998
Steve Howey|DEF|Newcastle 1993-1999, Man City 2000, Leicester 2003, Bolton 2003
Keith Gillespie|MID|Man Utd 1992-1994, Newcastle 1994-1997, Blackburn 1998, 2001, Leicester 2003, Sheffield Utd 2006|gillespie
David Batty|MID|Leeds 1992-1993, Blackburn 1993-1995, Newcastle 1995-1998, Leeds 1998-2003|batty
Temuri Ketsbaia|MID|Newcastle 1997-1999|ketsbaia
Gary Speed|MID|Leeds 1992-1995, Everton 1996-1997, Newcastle 1997-2003, Bolton 2004-2007|speed
Nolberto Solano|MID|Newcastle 1998-2003, Aston Villa 2003-2004, Newcastle 2005-2006, West Ham 2007|solano;nobby
Laurent Robert|MID|Newcastle 2001-2004, Portsmouth 2005, Derby 2007|robert
Craig Bellamy|ATT|Coventry 2000, Newcastle 2001-2004, Blackburn 2005, Liverpool 2006, West Ham 2007-2008, Man City 2008-2010, Liverpool 2011, Cardiff 2013|bellamy
Kieron Dyer|MID|Newcastle 1999-2006, West Ham 2007-2010, QPR 2011|dyer
Duncan Ferguson|ATT|Everton 1994-1998, Newcastle 1998-1999, Everton 2000-2005|big dunc;ferguson
Didier Domi|DEF|Newcastle 1998-2000|domi
Andy O'Brien|DEF|Bradford 1999-2000, Newcastle 2000-2004, Portsmouth 2005, Bolton 2007-2010|o brien
Lomana LuaLua|ATT|Newcastle 2000-2003, Portsmouth 2003-2006|lua lua
Ruel Fox|MID|Norwich 1992-1993, Newcastle 1993-1995, Tottenham 1995-1999
Darren Huckerby|ATT|Newcastle 1995, Coventry 1996-1998, Leeds 1999, Man City 2002, Norwich 2004|huckerby
Steve Watson|DEF|Newcastle 1993-1998, Aston Villa 1998-1999, Everton 2000-2004
Patrick Kluivert|ATT|Newcastle 2004|kluivert
Jon Dahl Tomasson|ATT|Newcastle 1997|tomasson
Alan Shearer|ATT|Blackburn 1992-1995, Newcastle 1996-2005|shearer
Tim Flowers|GK|Southampton 1992-1993, Blackburn 1993-1998, Leicester 1999-2001|flowers
Colin Hendry|DEF|Blackburn 1992-1998, Coventry 1999, Bolton 2001|hendry
Tim Sherwood|MID|Blackburn 1992-1998, Tottenham 1998-2002, Portsmouth 2003|sherwood
Jason Wilcox|MID|Blackburn 1992-1998, Leeds 1999-2003, Leicester 2003|wilcox
Stuart Ripley|MID|Blackburn 1992-1997, Southampton 1998-2000|ripley
Kevin Gallacher|ATT|Blackburn 1992-1998, Newcastle 1999-2000|gallacher
Mike Newell|ATT|Blackburn 1992-1995
Jeff Kenna|DEF|Southampton 1992-1994, Blackburn 1994-1998, Birmingham 2002
Ian Pearce|DEF|Blackburn 1993-1996, West Ham 1997-2002, Fulham 2003-2004
David Dunn|MID|Blackburn 1997-1998, 2001-2002, Birmingham 2003-2005, Blackburn 2006-2011|dunn
Matt Jansen|ATT|Crystal Palace 1997, Blackburn 2001-2005|jansen
Egil Østenstad|ATT|Southampton 1996-1998, Blackburn 1998, 2001|ostenstad
Lucas Neill|DEF|Blackburn 2001-2006, West Ham 2006-2008, Everton 2009|neill
Tugay|MID|Blackburn 2001-2008|tugay kerimoglu
Garry Flitcroft|MID|Man City 1992-1995, Blackburn 1995-1998, 2001-2003|flitcroft
Barry Ferguson|MID|Blackburn 2003-2004
Callum Davidson|DEF|Blackburn 1998, Leicester 2000-2001
Gordon Strachan|MID|Leeds 1992-1994, Coventry 1994-1996|strachan
Lee Chapman|ATT|Leeds 1992, West Ham 1993-1994, Ipswich 1994
Rod Wallace|ATT|Leeds 1992-1997, Bolton 2001
Tony Yeboah|ATT|Leeds 1994-1996|yeboah
John Lukic|GK|Leeds 1992-1995|lukic
Nigel Martyn|GK|Crystal Palace 1992, 1994, Leeds 1996-2002, Everton 2003-2005|martyn
Lucas Radebe|DEF|Leeds 1994-2003|radebe
Gary Kelly|DEF|Leeds 1992-2003
Ian Harte|DEF|Leeds 1995-2003, Sunderland 2007, Reading 2012|harte
Harry Kewell|ATT|Leeds 1995-2003, Liverpool 2003-2007|kewell
Mark Viduka|ATT|Leeds 2000-2003, Middlesbrough 2004-2006, Newcastle 2007-2008|viduka
Rio Ferdinand|DEF|West Ham 1995-2000, Leeds 2000-2001, Man Utd 2002-2013, QPR 2014|rio
Jonathan Woodgate|DEF|Leeds 1998-2002, Newcastle 2002-2003, Middlesbrough 2006-2007, Tottenham 2007-2010, Stoke 2011|woodgate
Lee Bowyer|MID|Leeds 1996-2002, West Ham 2002, Newcastle 2003-2005, West Ham 2006-2007, Birmingham 2009-2010|bowyer
Olivier Dacourt|MID|Everton 1998, Leeds 2000-2002, Fulham 2008|dacourt
Robbie Keane|ATT|Coventry 1999, Leeds 2000-2002, Tottenham 2002-2007, Liverpool 2008, Tottenham 2008-2010, West Ham 2010, Aston Villa 2011|keane
Eirik Bakke|MID|Leeds 1999-2003|bakke
Danny Mills|DEF|Charlton 1998, Leeds 1999-2003, Middlesbrough 2003, Man City 2004-2005|mills
Carlton Palmer|MID|Sheffield Wed 1992-1993, Leeds 1994-1996, Southampton 1997-1998, Nottingham Forest 1998, Coventry 1999-2000|palmer
Brian Deane|ATT|Sheffield Utd 1992-1993, Leeds 1993-1996, Middlesbrough 1998-2001, Leicester 2001|deane
David Wetherall|DEF|Leeds 1992-1998, Bradford 1999-2000
Tony Dorigo|DEF|Leeds 1992-1996, Derby 1998|dorigo
Alfie Haaland|MID|Nottingham Forest 1994-1996, Leeds 1997-1999, Man City 2000|alf inge haaland;haaland
Paul McGrath|DEF|Aston Villa 1992-1995, Derby 1996|mcgrath
Dean Saunders|ATT|Aston Villa 1992-1994, Nottingham Forest 1996, Bradford 1999|saunders
Dalian Atkinson|ATT|Aston Villa 1992-1994|atkinson
Ray Houghton|MID|Aston Villa 1992-1994, Crystal Palace 1994|houghton
Andy Townsend|MID|Aston Villa 1993-1997, Middlesbrough 1998|townsend
Ugo Ehiogu|DEF|Aston Villa 1992-2000, Middlesbrough 2000-2006|ehiogu
Gareth Southgate|DEF|Crystal Palace 1992, 1994, Aston Villa 1995-2000, Middlesbrough 2001-2005|southgate
Alan Wright|DEF|Blackburn 1992-1994, Aston Villa 1994-2002
Ian Taylor|MID|Aston Villa 1994-2002
Mark Draper|MID|Leicester 1994, Aston Villa 1995-2001
Savo Milošević|ATT|Aston Villa 1995-1997|milosevic
Lee Hendrie|MID|Aston Villa 1995-2006|hendrie
Juan Pablo Ángel|ATT|Aston Villa 2000-2006|angel
Darius Vassell|ATT|Aston Villa 1998-2004, Man City 2005-2008|vassell
Olof Mellberg|DEF|Aston Villa 2001-2007|mellberg
Thomas Hitzlsperger|MID|Aston Villa 2001-2004, West Ham 2010, Everton 2012|hitzlsperger
George Boateng|MID|Coventry 1997-1998, Aston Villa 1998-2001, Middlesbrough 2002-2007, Hull 2008|boateng
Benito Carbone|ATT|Sheffield Wed 1996-1999, Aston Villa 1999, Bradford 2000|carbone
Dion Dublin|ATT|Man Utd 1992-1993, Coventry 1994-1998, Aston Villa 1998-2003|dublin
Steve Stone|MID|Nottingham Forest 1992, 1994-1996, 1998, Aston Villa 1998-2002, Portsmouth 2003-2004|stone
Mark Delaney|DEF|Aston Villa 1999-2006
Jürgen Klinsmann|ATT|Tottenham 1994, 1997|klinsmann
Ian Walker|GK|Tottenham 1992-2000, Leicester 2001, 2003
Gary Mabbutt|DEF|Tottenham 1992-1997|mabbutt
Darren Anderton|MID|Tottenham 1992-2003, Birmingham 2004|anderton;sicknote
Chris Armstrong|ATT|Crystal Palace 1994, Tottenham 1995-2001
Justin Edinburgh|DEF|Tottenham 1992-1999
Steffen Freund|MID|Tottenham 1998-2003, Leicester 2003|freund
Ramon Vega|DEF|Tottenham 1996-2000|vega
Steffen Iversen|ATT|Tottenham 1996-2002, Wolves 2003|iversen
Sergei Rebrov|ATT|Tottenham 2000-2001|rebrov
Christian Ziege|DEF|Middlesbrough 1999, Liverpool 2000, Tottenham 2001-2003|ziege
Neil Sullivan|GK|Wimbledon 1992-1999, Tottenham 2000-2002, Chelsea 2003
Kasey Keller|GK|Leicester 1996-1998, Tottenham 2001-2004, Fulham 2007-2008|keller
Erik Thorstvedt|GK|Tottenham 1992-1995|thorstvedt
Mauricio Taricco|DEF|Tottenham 1998-2004|taricco
Hélder Postiga|ATT|Tottenham 2003|postiga
Frédéric Kanouté|ATT|West Ham 1999-2002, Tottenham 2003-2004|kanoute
Steve Carr|DEF|Tottenham 1993-2003, Newcastle 2004-2007, Birmingham 2009-2010
Gordon Durie|ATT|Tottenham 1992-1993|durie
Edgar Davids|MID|Tottenham 2005-2006|davids
Neville Southall|GK|Everton 1992-1996|southall
Dave Watson|DEF|Everton 1992-1998
Paul Rideout|ATT|Everton 1992-1996|rideout
Andy Hinchcliffe|DEF|Everton 1992-1997, Sheffield Wed 1997-1999|hinchcliffe
Daniel Amokachi|ATT|Everton 1994-1995|amokachi
Francis Jeffers|ATT|Everton 1997-2000, Arsenal 2001-2002, Everton 2003, Charlton 2004|jeffers
David Unsworth|DEF|Everton 1992-1996, West Ham 1997, Everton 1998-2003, Portsmouth 2004|unsworth
Thomas Gravesen|MID|Everton 2000-2004|gravesen
Alan Stubbs|DEF|Everton 2001-2004, Sunderland 2005, Everton 2005-2007|stubbs
David Weir|DEF|Everton 1999-2006|weir
Mark Pembridge|MID|Sheffield Wed 1995-1997, Everton 1999-2002, Fulham 2003-2005
Paul Gascoigne|MID|Middlesbrough 1998-1999, Everton 2000-2001|gazza;gascoigne
Tomasz Radzinski|ATT|Everton 2001-2003, Fulham 2004-2006|radzinski
Richard Dunne|DEF|Everton 1996-2000, Man City 2000, 2002-2009, Aston Villa 2009-2012, QPR 2014|dunne
John Collins|MID|Everton 1998-1999, Fulham 2001-2002
Niclas Alexandersson|MID|Sheffield Wed 1997-1999, Everton 2000-2002|alexandersson
Paolo Di Canio|ATT|Sheffield Wed 1997-1998, West Ham 1998-2002, Charlton 2003|di canio
Trevor Sinclair|MID|QPR 1993-1995, West Ham 1997-2002, Man City 2003-2006
Julian Dicks|DEF|West Ham 1993, Liverpool 1993-1994, West Ham 1994-1998|dicks
Tony Cottee|ATT|Everton 1992-1994, West Ham 1994-1996, Leicester 1997-2000|cottee
Luděk Mikloško|GK|West Ham 1993-1997|miklosko
Steve Lomas|MID|Man City 1993-1995, West Ham 1997-2002|lomas
Slaven Bilić|DEF|West Ham 1995-1996, Everton 1997-1998|bilic
Marc-Vivien Foé|MID|West Ham 1998-1999, Man City 2002|foe
Stuart Pearce|DEF|Nottingham Forest 1992, 1994-1996, Newcastle 1997-1998, West Ham 1999-2000|psycho;pearce
Igor Štimac|DEF|Derby 1996-1999, West Ham 1999-2000|stimac
Christian Dailly|DEF|Derby 1996-1998, Blackburn 1998, West Ham 2000-2002, 2005-2006|dailly
Iain Dowie|ATT|Southampton 1992-1994, Crystal Palace 1994, West Ham 1995-1997|dowie
Eyal Berkovic|MID|Southampton 1996, West Ham 1997-1998, Man City 2002-2003, Portsmouth 2004|berkovic
Bernard Lama|GK|West Ham 1997|lama
Matt Le Tissier|MID ATT|Southampton 1992-2001|le tissier;le god;tiss
Francis Benali|DEF|Southampton 1992-2002|benali
Jason Dodd|DEF|Southampton 1992-2004
Claus Lundekvam|DEF|Southampton 1996-2004|lundekvam
James Beattie|ATT|Blackburn 1997, Southampton 1998-2004, Everton 2004-2006, Sheffield Utd 2006, Stoke 2008-2009|beattie
Dave Beasant|GK|Chelsea 1992, Southampton 1993-1996, Nottingham Forest 1998|beasant
Paul Jones|GK|Southampton 1997-2003, Wolves 2003
Marian Pahars|ATT|Southampton 1998-2004|pahars
Hassan Kachloul|MID|Southampton 1998-2000, Aston Villa 2001|kachloul
Chris Marsden|MID|Southampton 1999-2003
Kevin Phillips|ATT|Sunderland 1999-2002, Southampton 2003-2004, Aston Villa 2005, Birmingham 2009, Crystal Palace 2013|super kev;phillips
Anders Svensson|MID|Southampton 2001-2004
Wayne Bridge|DEF|Southampton 1998-2002, Chelsea 2003-2008, Man City 2008-2011, Sunderland 2012, Reading 2012|bridge
Rory Delap|MID|Derby 1997-2000, Southampton 2001-2004, Sunderland 2005, Stoke 2008-2012|delap
Antti Niemi|GK|Southampton 2002-2004, Fulham 2005-2006|niemi
Jim Magilton|MID|Southampton 1993-1996, Sheffield Wed 1997, Ipswich 2000-2001|magilton
Ken Monkou|DEF|Southampton 1992-1998|monkou
Vinnie Jones|MID|Wimbledon 1992-1997|vinnie
John Fashanu|ATT|Wimbledon 1992-1993, Aston Villa 1994|fash;fashanu
Dean Holdsworth|ATT|Wimbledon 1992-1996, Bolton 1997, 2001|holdsworth
Robbie Earle|MID|Wimbledon 1992-1999|earle
Marcus Gayle|ATT|Wimbledon 1994-1999|gayle
Efan Ekoku|ATT|Norwich 1992-1994, Wimbledon 1994-1999|ekoku
Hans Segers|GK|Wimbledon 1992-1995|segers
Alan Kimble|DEF|Wimbledon 1993-1999
Chris Perry|DEF|Wimbledon 1993-1998, Tottenham 1999-2002, Charlton 2003-2005
Øyvind Leonhardsen|MID|Wimbledon 1994-1996, Liverpool 1997-1998, Tottenham 1999-2001, Aston Villa 2002|leonhardsen
Jason Euell|ATT|Wimbledon 1995-1999, Charlton 2001-2005, Middlesbrough 2005|euell
Carl Cort|ATT|Wimbledon 1996-1999, Newcastle 2000-2003, Wolves 2003|cort
Ben Thatcher|DEF|Wimbledon 1996-1999, Tottenham 2000-2002, Leicester 2003, Man City 2004-2006, Charlton 2006
Kenny Cunningham|DEF|Wimbledon 1994-1999, Birmingham 2002-2005
Chris Waddle|MID|Sheffield Wed 1992-1995|waddle
David Hirst|ATT|Sheffield Wed 1992-1997, Southampton 1997-1998|hirst
Mark Bright|ATT|Sheffield Wed 1992-1996, Charlton 1998
Des Walker|DEF|Sheffield Wed 1993-1999|des
John Sheridan|MID|Sheffield Wed 1992-1995, Bolton 1997
Andy Booth|ATT|Sheffield Wed 1996-1999
Kevin Pressman|GK|Sheffield Wed 1992-1999|pressman
Roland Nilsson|DEF|Sheffield Wed 1992-1993, Coventry 1997-1998
Andy Sinton|MID|QPR 1992, Sheffield Wed 1992-1995, Tottenham 1995-1998|sinton
Steve Ogrizovic|GK|Coventry 1992-1999|oggy;ogrizovic
Peter Ndlovu|ATT|Coventry 1992-1996|ndlovu
Mick Quinn|ATT|Coventry 1992-1994
Noel Whelan|ATT|Leeds 1993-1995, Coventry 1995-2000, Middlesbrough 2000-2002
Mustapha Hadji|MID|Coventry 1999-2000, Aston Villa 2001-2003|hadji
Paul Telfer|MID|Coventry 1995-2000, Southampton 2001-2004
Richard Shaw|DEF|Crystal Palace 1992, 1994, Coventry 1995-2000
Magnus Hedman|GK|Coventry 1997-2000|hedman
John Salako|MID|Crystal Palace 1992, 1994, Coventry 1995-1997|salako
Gary Breen|DEF|Coventry 1996-2000, West Ham 2002, Sunderland 2005
John Aloisi|ATT|Coventry 1997-1999|aloisi
Ray Wilkins|MID|QPR 1992-1995|wilkins
Andy Impey|MID|QPR 1992-1995, West Ham 1997, Leicester 1998-2001
David Bardsley|DEF|QPR 1992-1995
Kevin Gallen|ATT|QPR 1994-1995
Rufus Brevett|DEF|QPR 1992-1995, Fulham 2001-2002
Mark Robins|ATT|Norwich 1992-1994, Leicester 1994
Bryan Gunn|GK|Norwich 1992-1994
Jeremy Goss|MID|Norwich 1992-1994|goss
Graeme Sharp|ATT|Oldham 1992-1993
Gunnar Halle|DEF|Oldham 1992-1993, Leeds 1996-1998, Bradford 1999-2000
Marcus Stewart|ATT|Ipswich 2000-2001, Sunderland 2002
Hermann Hreiðarsson|DEF|Crystal Palace 1997, Wimbledon 1999, Ipswich 2000-2001, Charlton 2003-2006, Portsmouth 2007-2009|hreidarsson;hermann
Matt Holland|MID|Ipswich 2000-2001, Charlton 2003-2006
Richard Wright|GK|Ipswich 2000, Arsenal 2001, Everton 2002-2006
Titus Bramble|DEF|Ipswich 2000-2001, Newcastle 2002-2006, Wigan 2007-2009, Sunderland 2010-2011|bramble
Chris Kiwomya|ATT|Ipswich 1992-1994, Arsenal 1994
Finidi George|MID|Ipswich 2001|finidi
Niall Quinn|ATT|Man City 1992-1995, Sunderland 1996, 1999-2002|quinn
Uwe Rösler|ATT|Man City 1993-1995|rosler
Georgi Kinkladze|MID|Man City 1995, Derby 1999-2001|kinkladze;kinky
Keith Curle|DEF|Man City 1992-1995
Tony Coton|GK|Man City 1992-1995
Shaun Goater|ATT|Man City 2000, 2002|goater;the goat
Ali Benarbia|MID|Man City 2002|benarbia
Paulo Wanchope|ATT|Derby 1996-1998, West Ham 1999, Man City 2000, 2002-2003|wanchope
Sun Jihai|DEF|Man City 2002-2007|sun jihai
Sylvain Distin|DEF|Newcastle 2001, Man City 2002-2006, Portsmouth 2007-2008, Everton 2009-2014, Bournemouth 2015|distin
Bryan Roy|ATT|Nottingham Forest 1994-1996
Lars Bohinen|MID|Nottingham Forest 1994-1995, Blackburn 1995-1997, Derby 1997-2000|bohinen
Colin Cooper|DEF|Nottingham Forest 1994-1996, Middlesbrough 1998-2004
Mark Crossley|GK|Nottingham Forest 1992, 1994-1996
Pierre van Hooijdonk|ATT|Nottingham Forest 1996, 1998|van hooijdonk
Juninho|MID|Middlesbrough 1995-1996, 1999, 2002-2003|juninho paulista
Fabrizio Ravanelli|ATT|Middlesbrough 1996, Derby 2001|ravanelli
Emerson|MID|Middlesbrough 1996
Hamilton Ricard|ATT|Middlesbrough 1998-2001|ricard
Alen Bokšić|ATT|Middlesbrough 2000-2002|boksic
Mark Schwarzer|GK|Middlesbrough 1996, 1998-2007, Fulham 2008-2012, Chelsea 2013, Leicester 2014-2015|schwarzer
Robbie Mustoe|MID|Middlesbrough 1992, 1995-1996, 1998-2001, Charlton 2002
Gaizka Mendieta|MID|Middlesbrough 2003-2007|mendieta
Massimo Maccarone|ATT|Middlesbrough 2002-2006|maccarone
Gianluca Festa|DEF|Middlesbrough 1996, 1998-2001|festa
Franck Queudrue|DEF|Middlesbrough 2001-2005, Fulham 2006|queudrue
Jan Åge Fjørtoft|ATT|Swindon 1993, Middlesbrough 1995-1996, Barnsley 1997|fjortoft
Attilio Lombardo|MID|Crystal Palace 1997|lombardo
Dougie Freedman|ATT|Crystal Palace 1997, 2004, Nottingham Forest 1998|freedman
Steve Walsh|DEF|Leicester 1994, 1996-1999
Muzzy Izzet|MID|Leicester 1996-2001, Birmingham 2004-2005|izzet
Neil Lennon|MID|Leicester 1996-2000|lennon
Matt Elliott|DEF|Leicester 1996-2001, 2003
Robbie Savage|MID|Leicester 1996-2001, Birmingham 2002-2004, Blackburn 2004-2007, Derby 2007|savage
Steve Guppy|MID|Leicester 1997-2000|guppy
Ade Akinbiyi|ATT|Leicester 2000-2001|akinbiyi
Roberto Mancini|ATT|Leicester 2000|mancini
Jay-Jay Okocha|MID|Bolton 2002-2005|okocha
Youri Djorkaeff|MID|Bolton 2001-2003, Blackburn 2003|djorkaeff
Iván Campo|DEF MID|Bolton 2002-2007|campo
Guðni Bergsson|DEF|Tottenham 1992-1994, Bolton 1995, 1997, 2001-2002|bergsson
Michael Ricketts|ATT|Bolton 2001-2002, Middlesbrough 2003
Fredi Bobic|ATT|Bolton 2001|bobic
Nathan Blake|ATT|Bolton 1995, 1997, Blackburn 1998, Wolves 2003
Alan Thompson|MID|Bolton 1995, 1997, Aston Villa 1998-2000
Stelios Giannakopoulos|MID|Bolton 2003-2007|stelios
Bruno N'Gotty|DEF|Bolton 2001-2005|ngotty
Stig Tøfting|MID|Bolton 2002-2003|tofting
Mark Fish|DEF|Bolton 1997, Charlton 2000-2004|fish
Stefano Eranio|MID|Derby 1997-2000|eranio
Francesco Baiano|ATT|Derby 1997-1999|baiano
Aljoša Asanović|MID|Derby 1996-1997|asanovic
Dean Sturridge|ATT|Derby 1996-2000, Leicester 2000, Wolves 2003
Mart Poom|GK|Derby 1996-2001, Sunderland 2002|poom
Malcolm Christie|ATT|Derby 1998-2001, Middlesbrough 2003-2004
Horacio Carbonari|DEF|Derby 1998-2001|carbonari;bazooka
Russell Hoult|GK|Derby 1996-1999, West Brom 2002, 2004-2005
Thomas Sørensen|GK|Sunderland 1999-2002, Aston Villa 2003-2007, Stoke 2008-2012|sorensen
Michael Gray|DEF|Sunderland 1996, 1999-2002, Blackburn 2003-2006
Gavin McCann|MID|Everton 1997, Sunderland 1999-2002, Aston Villa 2003-2006, Bolton 2007-2009
Kevin Kilbane|MID|Sunderland 1999-2002, Everton 2003-2005, Wigan 2006-2008, Hull 2008-2009|kilbane
Julio Arca|MID|Sunderland 2000-2002, 2005, Middlesbrough 2006-2008|arca
Jody Craddock|DEF|Sunderland 1999-2002, Wolves 2003, 2009-2011
Claudio Reyna|MID|Sunderland 2001-2002, Man City 2003-2006|reyna
Clive Mendonca|ATT|Charlton 1998|mendonca
Richard Rufus|DEF|Charlton 1998, 2000-2002
Chris Powell|DEF|Derby 1996-1997, Charlton 1998, 2000-2003, 2005
Mark Kinsella|MID|Charlton 1998, 2000-2001, Aston Villa 2002
Dean Kiely|GK|Charlton 2000-2005|kiely
Claus Jensen|MID|Charlton 2000-2003, Fulham 2004-2006
Jonatan Johansson|ATT|Charlton 2000-2005|johansson
Shaun Bartlett|ATT|Charlton 2000-2005|bartlett
Luke Young|DEF|Tottenham 1999-2000, Charlton 2001-2006, Middlesbrough 2007, Aston Villa 2008-2010, QPR 2011-2012
Stuart McCall|MID|Bradford 1999-2000|mccall
Dean Windass|ATT|Bradford 1999-2000, Middlesbrough 2000-2001, Hull 2008|windass
Heiðar Helguson|ATT|Watford 1999, Fulham 2005-2006, Bolton 2007, QPR 2011|helguson
Sean Davis|MID|Fulham 2001-2003, Tottenham 2004-2005, Portsmouth 2005-2007, Bolton 2008-2010
Luís Boa Morte|ATT|Arsenal 1997-1998, Southampton 1999, Fulham 2001-2006, West Ham 2006-2009|boa morte
Barry Hayles|ATT|Fulham 2001-2003|hayles
Junichi Inamoto|MID|Fulham 2002-2003, West Brom 2004|inamoto
Alain Goma|DEF|Newcastle 1999-2000, Fulham 2001-2004|goma
Lee Clark|MID|Newcastle 1993-1996, Fulham 2001-2004
Steve Marlet|ATT|Fulham 2001-2003|marlet
Brian McBride|ATT|Everton 2002, Fulham 2004-2007|mcbride
Christophe Dugarry|ATT|Birmingham 2002-2003|dugarry
Stan Lazaridis|MID|West Ham 1996-1998, Birmingham 2002-2005|lazaridis
Mikael Forssell|ATT|Birmingham 2003, 2005, 2007|forssell
Maik Taylor|GK|Fulham 2001-2003, Birmingham 2003-2005, 2007, 2009-2010
Geoff Horsfield|ATT|Birmingham 2002-2003, West Brom 2004-2005|horsfield
Arjan de Zeeuw|DEF|Barnsley 1997, Portsmouth 2003-2004, Wigan 2005-2006|de zeeuw
Linvoy Primus|DEF|Portsmouth 2003-2008|primus
Nigel Quashie|MID|QPR 1995, Nottingham Forest 1998, Portsmouth 2003-2004, Southampton 2004, West Brom 2005, West Ham 2006-2007|quashie
Dejan Stefanović|DEF|Sheffield Wed 1995-1998, Portsmouth 2003-2006, Fulham 2007|stefanovic
`;
const merge = (s, add) => {
  add.forEach(([c,a,b]) => {
    const o = s.find(x => x[0]===c && x[1] <= b+1 && x[2] >= a-1);
    if(o){ o[1] = Math.min(o[1],a); o[2] = Math.max(o[2],b); } else s.push([c,a,b]);
  });
  s.sort((x,y) => x[1]-y[1] || x[2]-y[2]);
};
const P = window.FL_PLAYERS = window.FL_PLAYERS || [];
const byName = new Map(P.map(p => [p.n, p]));
RAW.trim().split("\n").forEach(line => {
  const [n, pos, sp, al] = line.split("|").map(x => (x||"").trim());
  const s = [];
  let club = null;
  sp.split(",").map(x => x.trim()).forEach(part => {
    const m = part.match(/^(.*?)\s*(\d{4})(?:-(\d{4}))?$/);
    if(!m) return;
    if(m[1]) club = m[1].trim();
    s.push([club, +m[2], +(m[3]||m[2])]);
  });
  const ex = byName.get(n);
  if(ex){ merge(ex.s, s); return; }
  const o = {n, p:pos, s:[]}; merge(o.s, s);
  if(al) o.a = al.split(";").map(x => x.trim()).filter(Boolean);
  P.push(o); byName.set(n, o);
});
})();
