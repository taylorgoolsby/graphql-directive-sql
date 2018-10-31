import { SchemaDirectiveVisitor } from 'graphql-tools'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLField,
  GraphQLArgument,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLInputField,
  GraphQLScalarType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLDirective,
  DirectiveLocation,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql'

export interface IGetSchemaDirectivesInput {
  directiveName?: string
}

export interface IGetSchemaDirectivesOutput {
  [directiveName: string]: typeof SchemaDirectiveVisitor
}

interface ITable {
  name: string
  columns: { [name: string]: IColumn }
  unicode?: boolean
}

interface IColumn {
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

const extractedData: { [name: string]: ITable } = {}

export function getSchemaDirectives({
  directiveName = 'sql',
}: IGetSchemaDirectivesInput = {}): IGetSchemaDirectivesOutput {
  class SqlDirective extends SchemaDirectiveVisitor {
    public static getDirectiveDeclaration(
      name: string,
      schema: GraphQLSchema
    ): GraphQLDirective {
      return new GraphQLDirective({
        name,
        locations: [
          DirectiveLocation.OBJECT,
          DirectiveLocation.FIELD_DEFINITION,
        ],
        args: {
          unicode: {
            type: GraphQLBoolean,
          },
          auto: {
            type: GraphQLBoolean,
          },
          default: {
            type: GraphQLString,
          },
          hide: {
            type: GraphQLBoolean,
          },
          index: {
            type: GraphQLBoolean,
          },
          length: {
            type: GraphQLInt,
          },
          nullable: {
            type: GraphQLBoolean,
          },
          primary: {
            type: GraphQLBoolean,
          },
          type: {
            type: GraphQLString,
          },
          unique: {
            type: GraphQLBoolean,
          },
        },
      })
    }
    public visitObject(object: GraphQLObjectType) {
      const tableName = object.name
      extractedData[tableName] = {
        name: tableName,
        columns: {},
        ...this.args,
      }
      // console.log('visitObject', tableName, this.args)
    }
    public visitFieldDefinition(field: GraphQLField<any, any>, details: any) {
      if (!this.args.hide) {
        const tableName = details.objectType.name
        const columnName = field.name
        extractedData[tableName] = {
          ...extractedData[tableName],
          name: tableName,
          columns: {
            ...extractedData[tableName].columns,
            [columnName]: {
              name: columnName,
              ...this.args,
            },
          },
        }
        console.log('extractedData', JSON.stringify(extractedData, null, '  '))
      }
      // console.log('visitFieldDefinition', tableName, columnName, this.args)
    }
  }

  return {
    [directiveName]: SqlDirective,
  }
}

// todo handle hide by using Schema Transforms to filter types marked with hide

export const directiveDeclaration = `directive @sql(
  unicode: Boolean
  auto: Boolean
  default: String
  hide: Boolean
  index: Boolean
  length: Int
  nullable: Boolean
  primary: Boolean
  type: String
  unique: Boolean
) on OBJECT | FIELD_DEFINITION`
