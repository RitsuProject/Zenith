/**
 * Zenith
 * Original Code: https://github.com/ManuelDevelopment/AnimeThemeBrowser/blob/master/bin/scanMongo.js
 * I just migrated to TypeScript and tweaked a few things, total credits for the original creator.
 * Also...this code is a little mess
 */

import axios from 'axios'
import { config } from 'dotenv'
import { JSDOM } from 'jsdom'
import Series from './database/entities/Series'
import Theme from './database/entities/Theme'
import mongoConnect from './database/MongoConnect'
import async, { ErrorCallback } from 'async'
import { mongoose } from '@typegoose/typegoose'
config()

interface SeasonObject {
  year: string
  quarter: number
  headers: JQuery
}

interface Source {
  url: string
}

interface VersionObject {
  index: number
  sources: Source[]
}

async function initAnimeThemesScan() {
  mongoConnect(process.env.MONGO_URI) // Connect to the database.
  console.log('[DATABASE] Waiting to the MongoDB...')
  mongoose.connection.once('open', async () => {
    console.log('[DATABASE] Deleting old entries...')
    await Theme.deleteMany({})
    await Series.deleteMany({})

    console.log('[ZENITH] Starting Zenith...')
    // Start Scraping the Year Index
    const yearIndex = await axios({
      url: 'https://old.reddit.com/r/AnimeThemes/wiki/year_index',
      method: 'GET',
    })
    const $ = require('jquery')(
      new JSDOM(yearIndex.data).window
    ) as JQueryStatic

    const anchor = $('.wiki h3 > a')

    async.eachSeries(
      $('.wiki h3 > a'),
      (anchor, callback) => {
        let href = $(anchor).attr('href')

        scanSeasonIndex(href, callback) // Scan the Season Index Page
      },
      () => {
        console.log('[ZENITH] Finished Scan.')
        process.exit(0)
      }
    )

    console.log(
      `[YEAR INDEX] Scanned ${anchor.length} hrefs from the year index.`
    )
  })
}

async function scanSeasonIndex(href: string, callback: ErrorCallback) {
  const yearPage = await axios.get(`https://old.reddit.com/${href}`)
  const $ = require('jquery')(new JSDOM(yearPage.data).window) as JQueryStatic
  let seasonHeaders = $('.wiki h2')

  let year = href.match(/\d+/)[0]
  let seasons = []

  if (seasonHeaders.length) {
    let i = 0
    for (let seasonHeader of seasonHeaders) {
      seasonHeader = $(seasonHeader)

      seasons.push({
        year: year,
        quarter: i++,
        headers: seasonHeader.nextUntil('.wiki h2', '.wiki h3'),
      })
    }
  } else {
    seasons.push({
      year: year,
      quarter: -1,
      headers: $('.wiki h3'),
    })
  }

  console.log(`[SEASON INDEX] Scanned ${seasons.length} seasons`)
  async.eachSeries(
    seasons,
    (season, callback) => scanSeason($, season, callback),
    callback
  )
}

async function scanSeason(
  $: JQueryStatic,
  season: SeasonObject,
  callback: ErrorCallback
) {
  async.eachSeries(
    season.headers,
    (element, callback) => {
      const seriesId = $(element).find('a').attr('href').match(/\d+/)[0]
      console.log(`[SEASONS] A new series has appeared! ID: ${seriesId}`)

      async.series(
        [
          async (callback) => {
            const alreadyOnDatabase = await Series.findById(seriesId)
            if (!alreadyOnDatabase) {
              let series = {
                _id: seriesId,
                title: $(element).find('a').text(),
                aliases:
                  $(element).next().is('p') &&
                  $(element).next().has('strong').length
                    ? $(element).next().find('strong').text().split(', ')
                    : [],
                season: {
                  year: season.year,
                  quarter: null,
                },
              }

              if (season.quarter >= 0) {
                series.season.quarter = season.quarter
              }

              // Save to the Database
              await new Series(series)
                .save()
                .then(() => {
                  console.log(
                    `[SERIES] A series with ID ${seriesId} has been saved to the database.`
                  )
                })
                .catch((err) => {
                  console.log(`[SERIES] ERR: ${err}`)
                })
            }
          },
          (callback) => {
            scanThemes($, element, seriesId, callback)
          },
        ],
        callback
      ),
        callback
    },
    callback
  )
}

async function scanThemes(
  $: JQueryStatic,
  header: any,
  seriesId: string,
  callback: ErrorCallback
) {
  let tables = $(header).nextUntil('h3').filter('table')

  let themes = []
  for (let table of tables) {
    let currentVersion: VersionObject
    for (let row of $(table).find('tbody tr')) {
      let cells = $(row).find('td')
      let title = cells.eq(0).text()
      if (title) {
        let regex = /([A-Z]+)(?:(\d+))*(?: [vV](\d*))* "([^"]+)"/
        let matches = title.match(regex)
        if (matches) {
          let type: number
          switch (matches[1]) {
            case 'OP':
              type = 0
              break
            case 'ED':
              type = 1
              break
          }
          if (type === undefined) {
            continue
          }

          let index = matches[2] || 1 - 1
          let title = matches[4]

          if (themes[type] === undefined) {
            themes[type] = []
          }

          if (themes[type][index] === undefined) {
            themes[type][index] = {
              _id: await generateThemeID(),
              series: seriesId,
              type: type,
              index: index,
              title: title,
              versions: [],
            }
          }

          themes[type][index].versions.push(
            (currentVersion = {
              index: themes[type][index].versions.length,
              sources: [],
            })
          )
        } else {
          console.log('[THEMES] No matches.')
          continue
        }
      }
      let anchor = cells.eq(1).find('a')
      if (anchor.is('a')) {
        let url = anchor.attr('href')
        if (url) {
          let source = {
            url: url,
          }

          currentVersion.sources.push(source)
        }
      }
    }
  }

  themes = themes.reduce(
    (themes, themeList) =>
      themes.concat(themeList.filter((theme) => !!theme) || []),
    []
  )

  async.eachSeries(
    themes,
    (theme, callback) => {
      new Theme(theme).save((err) => {
        if (err) {
          console.error('[THEMES] Error while saving ' + theme.title)
          console.error(err)
        } else {
          console.log(`[THEMES] Saved ${theme.title} to the database.`)
        }

        callback()
      })
    },
    callback
  )
}

function generateThemeID() {
  return new Promise(async (resolve) => {
    let id = Math.random().toString(36).substring(7)
    let existing = await Theme.findById(id)
    resolve(existing ? await generateThemeID() : id)
  })
}

initAnimeThemesScan()
