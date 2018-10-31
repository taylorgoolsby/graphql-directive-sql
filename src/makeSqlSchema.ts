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

export interface ITable {
  name: string
  columns: { [name: string]: IColumn }
  unicode?: boolean
}

export interface IColumn {
  name: string
  auto?: boolean
  default?: string
  index?: boolean
  length?: number
  nullable?: boolean
  primary?: boolean
  type?: string
  unicode?: boolean
  unique?: boolean
}

export interface ISQLAST {
  [name: string]: ITable
}

let sqlAST: ISQLAST = {}

export function addTable(table: ITable): void {
  sqlAST[table.name] = table
}
export function addColumn(tableName: string, column: IColumn): void {
  sqlAST[tableName] = {
    ...sqlAST[tableName],
    name: tableName,
    columns: {
      ...sqlAST[tableName].columns,
      [column.name]: column,
    },
  }
}

export function makeSqlSchema(options: IMakeSqlSchemaInput): void {
  sqlAST = {}
  const outputFilepath = options.outputFilepath
  delete options.outputFilepath
  makeExecutableSchema(options)
  console.log('SQL AST', JSON.stringify(sqlAST, null, '  '))
}
