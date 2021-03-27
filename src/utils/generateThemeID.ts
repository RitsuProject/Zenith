import Theme from '../database/entities/Theme'

export default function generateThemeID() {
  return new Promise(async (resolve) => {
    let id = Math.random().toString(36).substring(7)
    let existing = await Theme.findById(id)
    resolve(existing ? await generateThemeID() : id)
  })
}
