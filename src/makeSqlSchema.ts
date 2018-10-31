import {
  IExecutableSchemaDefinition,
  SchemaDirectiveVisitor,
  makeExecutableSchema,
} from 'graphql-tools'

const STRING_TYPES = [
  'CHAR',
  'VARCHAR',
  'BINARY',
  'VARBINARY',
  'BLOB',
  'TEXT',
  'ENUM',
  'SET',
]

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
  nullable?: boolean
  primary?: boolean
  type?: string
  graphQLType: string
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
  setDefaults()
  gatherIndices()
  renderCreateSchemaScript()
}

function setDefaults() {
  forEachTableDo(table => {
    forEachColumnDo(table, column => {
      /*
      export interface IColumn {
        name: string
        auto?: boolean
        default?: string
        index?: boolean
        nullable?: boolean
        primary?: boolean
        type?: string
        unicode?: boolean
        unique?: boolean
      }
      */
      if (column.primary && column.nullable) {
        emitError(
          table.name,
          column.name,
          '@primary is not allowed with @nullable.'
        )
      }

      if (!column.type) {
        if (column.graphQLType === 'String') {
          emitError(
            table.name,
            column.name,
            `String types must be explicitly defined using @type.`
          )
        } else if (column.graphQLType === 'Int') {
          column.type = 'INT'
        } else if (column.graphQLType === 'Float') {
          column.type = 'DECIMAL'
        } else if (column.graphQLType === 'Boolean') {
          column.type = 'BOOLEAN'
        } else if (column.graphQLType === 'JSON') {
          column.type = 'JSON'
        }
      }

      column.type = (column.type || '').toUpperCase()

      if (column.auto) {
        // @ts-ignore
        if (!column.type.includes('INT') && column.type !== 'SERIAL') {
          emitError(
            table.name,
            column.name,
            `Column with "auto" must have INT or SERIAL type.`
          )
        }
        if (column.default) {
          emitError(
            table.name,
            column.name,
            '"default" is not allowed with "auto".'
          )
        }
        if (column.unicode) {
          emitError(
            table.name,
            column.name,
            '"unicode" is not allowed with "auto".'
          )
        }
      }

      if (column.unicode) {
        // @ts-ignore
        if (!STRING_TYPES.includes(stripLength(column.type))) {
          emitError(
            table.name,
            column.name,
            '@unicode can only be applied to a string type.'
          )
        }
      }
    })
  })
}

function gatherIndices() {
  forEachTableDo(table => {
    forEachColumnDo(table, column => {
      if (column.primary) {
        if (!!table.primaryIndex) {
          emitError(
            table.name,
            column.name,
            'More than one column is marked as the primary index.'
          )
        } else {
          table.primaryIndex = column
        }
      } else if (column.index) {
        table.secondaryIndices = table.secondaryIndices || []
        table.secondaryIndices.push(column)
      }
    })
    if (!table.primaryIndex) {
      emitError(
        table.name,
        '',
        `Table ${table.name} does not have a primary index.`
      )
    }
  })
}

function renderCreateSchemaScript() {
  console.log('Creating script from:', JSON.stringify(sqlAST, null, '  '))
}

function forEachTableDo(foo: (table: ITable) => void): void {
  for (const tableName in sqlAST) {
    if (!sqlAST.hasOwnProperty(tableName)) continue
    const table: ITable = sqlAST[tableName]
    foo(table)
  }
}

function forEachColumnDo(table: ITable, foo: (column: IColumn) => void): void {
  for (const columnName in table.columns) {
    if (!table.columns.hasOwnProperty(columnName)) continue
    const column: IColumn = table.columns[columnName]
    foo(column)
  }
}

function emitError(
  tableName: string,
  columnName: string,
  message: string
): void {
  throw new Error(`[${tableName} : ${columnName}]: ${message}`)
}

function stripLength(type: string): string {
  return type.split('(')[0]
}
