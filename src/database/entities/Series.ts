import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose'

class Season {
  @prop()
  public year!: number

  @prop()
  public quarter!: number
}

class Series {
  @prop({ required: true })
  public _id!: number

  @prop({ required: true })
  public title!: string

  @prop({ required: true, _id: false })
  public season!: Season

  @prop()
  public aliases: string[]
}

export type SeriesDocument = DocumentType<Series>
export default getModelForClass(Series)
