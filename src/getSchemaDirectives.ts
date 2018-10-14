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
          options: {
            type: GraphQLString,
          },
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
      console.log('visitObject', object, this.args)
    }
    public visitFieldDefinition(field: GraphQLField<any, any>) {
      console.log('visitFieldDefinition', field.name, this.args)
    }
  }

  return {
    [directiveName]: SqlDirective,
  }
}

export const directiveDeclaration = `directive @sql(
  options: String
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
