import {
  DocumentType,
  getModelForClass,
  mongoose,
  prop,
  Ref,
} from '@typegoose/typegoose'
import Series, { SeriesDocument } from './Series'

class Source {
  @prop({ required: true })
  public url!: string
}

class Version {
  @prop({ required: true })
  public index!: number

  @prop({ required: true, _id: false })
  public sources!: Source[]
}

class Theme {
  @prop({ required: false })
  public _id?: string

  @prop({ ref: () => Series })
  public series!: number

  @prop()
  public type!: string

  @prop()
  public index!: number

  @prop()
  public artist!: number

  @prop()
  public title!: string

  @prop({ _id: false })
  public versions!: Version[]
}

export type ThemeDocument = DocumentType<Theme>
export default getModelForClass(Theme)
