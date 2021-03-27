import mongoose from 'mongoose'

/**
 * Connect to the MongoDB
 * @param {String} uri - MongoDB Connection URL
 */
export default function mongoConnect(uri: string) {
  const connect = () => {
    mongoose
      .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        return console.log(`[DATABASE] Successfully connected.`)
      })
      .catch(() => {
        console.log('[DATABASE] Error connecting to database.')
        return process.exit(1)
      })
  }
  connect()

  mongoose.connection.on('disconnected', connect)
}
