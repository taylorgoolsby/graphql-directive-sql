import {
  IExecutableSchemaDefinition,
  SchemaDirectiveVisitor,
} from 'graphql-tools'

export interface IMakeSqlSchemaInput extends IExecutableSchemaDefinition {
  schemaDirectives: {
    [name: string]: typeof SchemaDirectiveVisitor
  }
  outputFilepath: string
}

export function makeSqlSchema(options: IMakeSqlSchemaInput): void {}
