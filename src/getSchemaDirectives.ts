import { SchemaDirectiveVisitor } from 'graphql-tools'

export interface IGetSchemaDirectivesInput {
  directiveName?: string
}

export interface IGetSchemaDirectivesOutput {
  [directiveName: string]: typeof SchemaDirectiveVisitor
}

export function getSchemaDirectives({
  directiveName = 'sql',
}: IGetSchemaDirectivesInput = {}): IGetSchemaDirectivesOutput {
  class SqlDirective extends SchemaDirectiveVisitor {}

  return {
    [directiveName]: SqlDirective,
  }
}
