<h1 align="center">Zenith</h1>
<p align="center">🪐 Github Action responsible for webscraping the index of r/AnimeThemes</p>

A Github Action (made especially for Ritsu) that scraps the index on Reddit from r/AnimeThemes (which is giant). I ended up doing this because since the beginning of Ritsu we use the AnimeThemes API, but the problem is: The API is in constant development and is not production-ready and much less stable. And it is obvious that relying on a third-party service that is not stable and can have many bugs out there is not a good idea.

## Tiny Alert

This code is a mess and was done very quickly, it can contain unexpected bugs that unfortunately I will only discover over time, I will continue to refactor and reorganize some things but it is almost certainly still going to be bad. Proceed with caution.

## Credits

Total credits to ManuelDevelopment, I just migrated to TypeScript and made some changes. The original code was made by him and you can find it here:
https://github.com/ManuelDevelopment/AnimeThemeBrowser/blob/master/bin/scanMongo.js
