# Paspoortbureau Plus13

Twee pagina's om de paspoorten voor het krokusweekend te maken:

| Pagina | Voor wie | Wat |
|---|---|---|
| `paspoort/admin.html` | thema-verantwoordelijke | achtergrond uit Krita, formaat, fotokader en tekstvelden verslepen, ledenlijst, overzicht, PDF voor de drukker |
| `paspoort/index.html` | begeleiding | lid kiezen, foto plakken (Ctrl+V), goed schuiven, **Klaar?** aanvinken |

De foto's en de ledenlijst staan **niet** op GitHub. Ze staan in een Google Sheet en een Drive-map van het account dat de backend installeert. De site op GitHub bevat alleen de code.

- Ledenlijst: tabblad **Leden** in de Google Sheet
- Foto's: Drive-map *Plus13 paspoortfoto's*, elk bestand heet `voornaam_achternaam.png` (bv. `bert_van-den-broeck.png`)
- Ontwerp: tabblad **Instellingen**, cel A1

Elke foto wordt bewaard met een *relatieve* uitsnede (welk punt in het midden van het kader staat, en hoeveel ingezoomd). Maak je in de admin het fotokader groter, kleiner of anders van vorm, dan past elk paspoort zich vanzelf aan, ook de paspoorten die al klaar zijn.

## Eerst proberen zonder Google

Laat `API_URL` in `paspoort/common.js` leeg en open de pagina's op GitHub Pages. Ze draaien dan in **demo-modus** met zes voorbeeldleden. Alles wat je doet, blijft dan alleen in je eigen browser.

## Installatie (één keer, ±10 minuten)

1. **Google Sheet maken.** Maak in Google Drive een nieuwe spreadsheet, bv. *Plus13 Paspoorten*. Gebruik het account waarop de foto's mogen staan (bij voorkeur een Plus13-account).
2. **Script plakken.** Kies in die Sheet *Extensies → Apps Script*. Wis wat er staat, plak de inhoud van `apps-script/Code.gs` en klik op opslaan.
3. **Setup uitvoeren.** Kies bovenaan de functie `setup` en klik op *Uitvoeren*. Geef toestemming: Google waarschuwt dat de app niet geverifieerd is, kies dan *Geavanceerd → Ga naar …*. Het **uitvoeringslogboek** toont daarna:
   - de **code voor de begeleiding**
   - de **admincode**
   - de link naar de fotomap

   Wil je andere codes? Dat kan via *Projectinstellingen → Scripteigenschappen* (`CODE_BEGELEIDING`, `CODE_ADMIN`).
4. **Publiceren als web-app.** Kies *Implementeren → Nieuwe implementatie → type: Web-app* en zet:
   - *Uitvoeren als:* **Ik**
   - *Wie heeft toegang:* **Iedereen**

   Klik op *Implementeren* en kopieer de URL (die eindigt op `/exec`).
5. **URL invullen.** Plak die URL in `paspoort/common.js` bij `const API_URL = '';` en commit.
6. **Delen.** Stuur de begeleiding de link `https://<jullie-domein>/paspoort/` en de begeleidingscode. Jij gebruikt `https://<jullie-domein>/paspoort/admin.html` met de admincode. De code wordt per browser onthouden.

Pas je later `Code.gs` aan? Kies dan *Implementeren → Implementaties beheren → potloodje → Versie: Nieuwe versie*. De URL blijft dezelfde.

## Werkwijze

1. Admin: plak de ledenlijst (`Groep;Voornaam;Achternaam`, of rechtstreeks uit Excel) en upload de achtergrond. Exporteer die in Krita op het formaat dat de pagina toont, aan 300 dpi. Zet de vaste labels (Naam, Groep, …) al in de achtergrond. De tool vult alleen de waarden in.
2. Begeleiding: klik op een naam en plak de foto. Een foto op een naam in de lijst slepen kan ook. Schuif en zoom de foto, vink **Klaar?** aan en klik op **Opslaan**. Het lid zakt naar *Klaar* met een ✓ en het volgende lid opent vanzelf.
3. Admin: kijk alles na bij *Alle paspoorten* en klik op **PDF maken**. Je krijgt A4-vellen met snijtekens of één paspoort per pagina, op 300 dpi.

## Goed om te weten

- **Privacy:** het gaat om foto's van minderjarigen. De Drive-map is privé. De foto's zijn alleen op te vragen met een code, en de repo bevat geen foto's of codes. Wis de map na het weekend.
- **Dubbele namen:** twee leden met exact dezelfde naam krijgen dezelfde sleutel. Zet bij één van beiden een extra letter in de achternaam (bv. `Peeters B.`).
- **Naam wijzigen** in de admin hernoemt ook het fotobestand in Drive.
- **Volgorde** (lijst, nummers en PDF): de groepsvolgorde uit de admin, daarna alfabetisch op voornaam en achternaam. Dat pas je aan in `sortMembers` in `common.js`.
- **iPhone-foto's (HEIC)** werken alleen als ze via de iPhone zelf gekozen worden. Op een computer zet je ze eerst om naar JPG.
- Tegelijk werken mag. Werken twee mensen aan hetzelfde lid, dan wint de laatste opslag.

## Bestanden

```
apps-script/Code.gs      backend: plakken in Google Apps Script (staat niet op de site)
paspoort/index.html      pagina voor de begeleiding
paspoort/begeleiding.js
paspoort/admin.html      pagina voor de admin
paspoort/admin.js
paspoort/common.js       gedeelde code + API_URL
paspoort/style.css
```
