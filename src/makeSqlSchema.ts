import {
  IExecutableSchemaDefinition,
  SchemaDirectiveVisitor,
  makeExecutableSchema,
} from 'graphql-tools'

export interface IMakeSqlSchemaInput extends IExecutableSchemaDefinition {
  schemaDirectives: {
    [name: string]: typeof SchemaDirectiveVisitor
  }
  outputFilepath: string
}

export function makeSqlSchema(options: IMakeSqlSchemaInput): void {
  const outputFilepath = options.outputFilepath
  delete options.outputFilepath
  makeExecutableSchema(options)
}
