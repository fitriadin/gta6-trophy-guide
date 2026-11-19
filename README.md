# GTA 6 Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/fitriadin/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/fitriadin/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: a checklist with saved progress, a guide to each trophy in this guide's own words with its sources named, a five-phase roadmap to the platinum, the one missable trophy flagged, and a spoiler setting that hides story trophies until earned. Built for the [make.fun bounty "Build the best GTA 6 trophy guide"](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **All 55 trophies** with their official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze), verified against Exophase and PSNProfiles on 2026-11-19.
- **Tracker**: tick trophies off; progress is saved in the browser (localStorage), with export to a JSON file and import back. Progress ring, per-grade counts, and a next-up suggestion.
- **Filters**: by kind (story, side, collectibles, activities, crime, money, exploration, one-off, milestone), by grade, by status (earned/remaining), missable only, and search by name. There are no online trophies in this list — all 55 are single-player, and the app says so.
- **Spoiler setting**: hides story trophies' names, descriptions and guides until they are earned. Persisted.
- **Roadmap to the platinum**: five phases built from the official descriptions — story chapters and missions first, side content as it opens, cleanup after the credits. About 200 hours, difficulty 4/10, one playthrough.
- **Missable flags**: exactly one trophy is potentially missable — Positive Mental Attitude (the Chapter 1 balcony meditation). Everything else stays available after the credits.
- **A guide per trophy**, each citing its sources by name beside it. Five trophies have no confirmed unlock method at launch and are marked unconfirmed, with only what the official description states plus clearly-labelled reported hints.
- **Fully offline**: static files, no build step, no webfonts, no CDN, no network requests at run time. No Rockstar logo or official artwork anywhere — the look is this guide's own.

## Run it offline

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Or serve `app/` with any static file server and open `index.html` in desktop Chrome. It works with the network off.

## Data

`app/data/trophies.json` holds the 55 trophies: official name, description and grade, kind, hidden flag, PSN progress target where one exists, missable/unconfirmed flags, the guide, and its named sources.

## Sources

Guides are written in this guide's own words from the facts these sources report; each trophy's guide names its sources beside it.

- Exophase — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- Output Lag — https://outputlag.com/guides/gta-6-trophy-list/
- KeenGamer — https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/
- GTA Zone — https://gta-zone.com/news/gta-6-trophies-achievements/
- CryptoGames — https://cryptogames.gg/gta-6-trophies-achievements-full-list/
- HowToVideoGame — https://howtovideogame.com/gta-6-trophies/
- Of Zen and Computing — https://www.ofzenandcomputing.com/gta-6-trophy-list-trophies-achievements/
- U7BUY — https://www.u7buy.com/blog/gta-6-trophies/

Rockstar has published no trophy list itself; the list is as PlayStation, Exophase and PSNProfiles publish it at launch. Unofficial fan guide — not affiliated with Rockstar Games, Take-Two Interactive or PlayStation.

## License

MIT — see [LICENSE](LICENSE).

---

Built for make.fun — https://make.fun/r/3jqkx1q8
