import * as fs from 'fs-extra'
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
  databaseName: string
  tablePrefix?: string
}

export interface ITable {
  name: string
  columns: { [name: string]: IColumn }
  primaryIndex?: IColumn
  secondaryIndices?: IColumn[]
  unicode?: boolean
  constraints?: string
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
      ...(sqlAST[tableName] || {}).columns,
      [column.name]: column,
    },
  }
}

export function makeSqlSchema(options: IMakeSqlSchemaInput): void {
  sqlAST = {}
  const outputFilepath = options.outputFilepath
  const databaseName = options.databaseName
  const tablePrefix = options.tablePrefix || ''
  delete options.outputFilepath
  delete options.databaseName
  makeExecutableSchema(options)
  setDefaults()
  gatherIndices()
  renderCreateSchemaScript(databaseName, tablePrefix, outputFilepath)
}

function setDefaults() {
  forEachTableDo(table => {
    forEachColumnDo(table, column => {
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
        } else {
          emitError(
            table.name,
            column.name,
            `A default SQL type cannot be generated for GraphQL type ${
              column.graphQLType
            }`
          )
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
        if (!table.unicode) {
          table.unicode = true
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

function renderCreateSchemaScript(
  databaseName: string,
  tablePrefix: string,
  outputFilepath: string
): void {
  // console.log('Creating script from:', JSON.stringify(sqlAST, null, '  '))

  const tableDefinitions: string[] = []
  forEachTableDo(table => {
    const columnDefinitions: string[] = []
    forEachColumnDo(table, column => {
      const nullClause = !!column.nullable ? 'NULL ' : 'NOT NULL '
      const unicodeClause = !!column.unicode
        ? 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci '
        : ''
      const defaultClause = !!column.default ? `DEFAULT ${column.default} ` : ''
      const autoClause = !!column.auto ? 'AUTO_INCREMENT ' : ''
      const uniqueClause = !!column.unique ? `UNIQUE ` : ''
      columnDefinitions.push(
        `\`${column.name}\` ${
          column.type
        } ${unicodeClause}${nullClause}${defaultClause}${autoClause}${uniqueClause}`.trim()
      )
    })

    const primaryKeyName = (table.primaryIndex && table.primaryIndex.name) || ''

    let indexDefinitions = (table.secondaryIndices || []).map(column => {
      return `INDEX \`${column.name.toUpperCase()}INDEX\` (\`${
        column.name
      }\` ASC)`
    })
    if (indexDefinitions.length > 0) {
      indexDefinitions = [''].concat(indexDefinitions)
    }

    const constraints = table.constraints ? ',\n  ' + table.constraints : ''
    // let constraints = (table.constraints || '').split(/,\s*/).join(',\n  ')
    // constraints = constraints ? ',\n  ' + constraints : ''

    const unicodeModifier = table.unicode
      ? ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
      : ''

    tableDefinitions.push(
      `CREATE TABLE \`${databaseName}\`.\`${tablePrefix}${table.name}\` (
  ${columnDefinitions.join(',\n  ')},
  PRIMARY KEY (\`${primaryKeyName}\`)${indexDefinitions.join(
        ',\n  '
      )}${constraints}
)${unicodeModifier};`
    )
  })

  fs.outputFileSync(`${outputFilepath}`, tableDefinitions.join('\n\n'))
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
