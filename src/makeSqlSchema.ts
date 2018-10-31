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
  primaryIndex?: IColumn
  secondaryIndices?: IColumn[]
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
  gatherIndices()
  renderCreateSchemaScript()
}

function gatherIndices() {
  for (const tableName in sqlAST) {
    if (!sqlAST.hasOwnProperty(tableName)) continue
    const table: ITable = sqlAST[tableName]

    for (const columnName in table.columns) {
      if (!table.columns.hasOwnProperty(columnName)) continue
      const column: IColumn = table.columns[columnName]

      if (column.primary) {
        if (!!table.primaryIndex) {
          throw new Error(
            'More than one column is marked as the primary index.'
          )
        } else {
          table.primaryIndex = column
        }
      } else if (column.index) {
        table.secondaryIndices = table.secondaryIndices || []
        table.secondaryIndices.push(column)
      }
    }

    if (!table.primaryIndex) {
      throw new Error(`Table ${tableName} does not have a primary index.`)
    }
  }
}

function renderCreateSchemaScript() {
  console.log('Creating script from:', JSON.stringify(sqlAST, null, '  '))
}
